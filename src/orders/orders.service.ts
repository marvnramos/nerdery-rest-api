import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../utils/prisma/prisma.service';
import { AddOrderArgs } from './dto/args/add.order.args';
import { AddOrderRes } from './dto/responses/add.order.res';
import { CartsService } from '../carts/carts.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { plainToInstance } from 'class-transformer';
import { GetOrdersArgs } from './dto/args/get.orders.args';
import { GetOrdersRes } from './dto/responses/get.orders.res';
import { decodeBase64, encodeBase64 } from '../utils/tools';
import { OrderType } from './types/order.type';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cartService: CartsService,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async addOrder(userId: string, args: AddOrderArgs): Promise<AddOrderRes> {
    const cart = await this.cartService.findCartById(args.cartId);
    const user = await this.usersService.getUserById(userId);

    if (cart.user_id !== user.id) {
      throw new NotAcceptableException('Unauthorized to access this cart');
    }

    const cartItems = await this.cartService.getCartItems(args.cartId);
    if (cartItems.length === 0) {
      throw new NotAcceptableException('Cart has no items');
    }

    const order = await this.createOrder(args, user);

    await this.createOrderDetails(order.id, cartItems);

    await this.cartService.clearCartItems(args.cartId);

    return plainToInstance(AddOrderRes, order);
  }

  async getOrderById(orderId: string): Promise<OrderType> {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        orderDetails: {
          select: {
            id: true,
            product_id: true,
            quantity: true,
            unit_price: true,
            product: {
              include: {
                categories: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const orderDetails = order.orderDetails.map((detail) => {
      if (!detail.product_id) {
        throw new Error(
          `OrderDetail with missing product_id: ${JSON.stringify(detail)}`,
        );
      }

      return {
        ...detail,
        productId: detail.product_id,
        unitPrice: detail.unit_price,
      };
    });

    return plainToInstance(
      OrderType,
      {
        ...order,
        orderDetails,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async getOrders(data: GetOrdersArgs): Promise<GetOrdersRes> {
    const { userId, first, after } = data;

    const whereClause: any = {
      ...(userId ? { user_id: userId } : {}),
      ...(after ? { id: { gt: decodeBase64(after) } } : {}),
    };

    const totalCount = await this.prismaService.order.count({
      where: whereClause,
    });

    const orders = await this.prismaService.order.findMany({
      where: whereClause,
      take: first,
      orderBy: { id: 'asc' },
      include: {
        orderDetails: {
          select: {
            id: true,
            product_id: true,
            quantity: true,
            unit_price: true,
            product: {
              include: {
                categories: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!orders || orders.length === 0) {
      throw new Error('No orders found.');
    }

    const orderInstances = orders.map((order) => {
      if (!order.id) {
        throw new NotFoundException(
          `Order with missing ID: ${JSON.stringify(order)}`,
        );
      }

      const orderDetails = order.orderDetails.map((detail) => {
        if (!detail.product_id) {
          throw new Error(
            `OrderDetail with missing product_id: ${JSON.stringify(detail)}`,
          );
        }

        return {
          ...detail,
          productId: detail.product_id,
          unitPrice: detail.unit_price,
        };
      });

      return plainToInstance(
        OrderType,
        {
          ...order,
          orderDetails,
        },
        {
          excludeExtraneousValues: true,
        },
      );
    });

    const edges = orderInstances.map((order) => ({
      node: order,
      cursor: encodeBase64(order.id),
    }));

    const response = new GetOrdersRes();
    response.edges = edges;
    response.nodes = orderInstances;
    response.pageInfo = {
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      hasNextPage: totalCount > first + (after ? 1 : 0),
      hasPreviousPage: !!after,
    };
    response.totalCount = totalCount;

    return response;
  }

  private async createOrder(args: AddOrderArgs, user: any) {
    return this.prismaService.order.create({
      data: {
        address: args.address || user.address,
        nearby_landmark: args.nearbyLandmark || 'No landmark provided',
        user_id: user.id,
      },
    });
  }

  private async createOrderDetails(orderId: string, cartItems: any[]) {
    const orderDetails = cartItems.map(async (item) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: await this.productsService.getProductUnitPrice(
        item.product_id,
      ),
    }));

    return this.prismaService.orderDetail.createMany({
      data: await Promise.all(orderDetails),
    });
  }
}
