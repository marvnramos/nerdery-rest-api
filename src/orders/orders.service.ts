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
import { decodeBase64, encodeBase64 } from '../utils/tools';
import { OrderType } from './types/order.type';
import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { PaginatedOrdersType } from './types/orders.connection.type';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cartService: CartsService,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async addOrder(userId: string, args: AddOrderArgs): Promise<AddOrderRes> {
    const cart = await this.validateCartOwnership(userId, args.cartId);
    const cartItems = await this.validateCartItems(args.cartId);

    const order = await this.createOrder(args, cart.user_id);
    await this.createOrderDetails(order.id, cartItems);
    await this.cartService.clearCartItems(args.cartId);

    return plainToInstance(AddOrderRes, order);
  }

  async getOrderById(orderId: string): Promise<OrderType> {
    const order = await this.fetchOrderWithDetails(orderId);
    const orderDetails = this.validateOrderDetails(order.orderDetails);

    return plainToInstance(OrderType, {
      ...order,
      orderDetails,
    });
  }

  async getPaginatedOrders(args: GetOrdersArgs): Promise<PaginatedOrdersType> {
    const orders = await this.fetchPaginatedOrders(args);
    return plainToInstance(PaginatedOrdersType, orders);
  }

  private async validateCartOwnership(userId: string, cartId: string) {
    const cart = await this.cartService.findCartById(cartId);
    if (cart.user_id !== userId) {
      throw new NotAcceptableException('Unauthorized to access this cart');
    }
    return cart;
  }

  private async validateCartItems(cartId: string) {
    const cartItems = await this.cartService.getCartItems(cartId);
    if (cartItems.length === 0) {
      throw new NotAcceptableException('Cart has no items');
    }
    return cartItems;
  }

  private async createOrder(args: AddOrderArgs, userId: string) {
    const user = await this.usersService.getUserById(userId);

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

  private async fetchOrderWithDetails(orderId: string) {
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

    return order;
  }

  private validateOrderDetails(orderDetails: any[]) {
    return orderDetails.map((detail) => {
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
  }

  private async fetchPaginatedOrders(args: GetOrdersArgs) {
    const whereClause: any = {
      ...(args.userId ? { user_id: args.userId } : {}),
      ...(args.after ? { id: { gt: decodeBase64(args.after) } } : {}),
    };
    return findManyCursorConnection(
      (findArgs) =>
        this.prismaService.order.findMany({
          where: whereClause,
          take: args.first,
          orderBy: { id: 'asc' },
          include: {
            user: { include: { role: true } },
            orderDetails: {
              include: {
                product: {
                  include: {
                    categories: true,
                    images: true,
                  },
                },
              },
            },
            paymentDetail: {
              include: {
                status: true,
              },
            },
          },
          ...findArgs,
        }),
      () =>
        this.prismaService.order.count({
          where: whereClause,
        }),
      args,
      {
        getCursor: (order) => ({ id: encodeBase64(order.id) }),
      },
    ).catch(() => {
      throw new NotFoundException('No orders found');
    });
  }
}
