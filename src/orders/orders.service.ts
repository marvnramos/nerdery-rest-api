import {
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddOrderArgs } from './dto/args/add.order.args';
import { AddOrderRes } from './dto/responses/add.order.res';
import { CartsService } from '../carts/carts.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { plainToInstance } from 'class-transformer';
import { GetOrdersArgs } from './dto/args/get.orders.args';
import {
  decodeBase64,
  encodeBase64,
  mapResultToIds,
} from '../../utils/index.util';
import { OrderType } from './types/order.type';
import { PaginatedOrdersType } from './dto/responses/orders.pagination.type.res';
import { Prisma, UserRoleType } from '@prisma/client';
import { OrderDetailType } from './types/order.detail.type';

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

  async getOrderById(
    orderId: string,
    user: { id: string; role: UserRoleType },
  ): Promise<OrderType> {
    const order = await this.fetchOrderWithDetails(orderId);
    if (user.role === UserRoleType.CLIENT) {
      if (order.user_id !== user.id) {
        throw new NotAcceptableException('Unauthorized to access this order');
      }
    }
    return plainToInstance(OrderType, order);
  }

  async getPaginatedOrders(
    args: GetOrdersArgs,
    currentUser: { id: string; role: UserRoleType },
  ): Promise<PaginatedOrdersType> {
    if (currentUser.role === UserRoleType.CLIENT) {
      if (args.userEmail) {
        throw new ForbiddenException('Unauthorized to access this resource');
      }
      args.userId = currentUser.id;
    }

    const orders = await this.fetchPaginatedOrders(args);
    return plainToInstance(PaginatedOrdersType, orders);
  }

  async getOrderDetailsByBatch(
    orderIds: readonly string[],
  ): Promise<(OrderDetailType | any)[]> {
    const orderDetails = await this.prismaService.orderDetail.findMany({
      where: { order_id: { in: [...orderIds] } },
      include: {
        product: true,
      },
    });

    return mapResultToIds(orderIds, orderDetails);
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
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  private async fetchPaginatedOrders(args: GetOrdersArgs) {
    const cursorId = args.after ? decodeBase64(args.after) : null;

    const where: Prisma.OrderWhereInput = {
      user: {
        email: args.userEmail || undefined,
      },
      user_id: args.userId || undefined,
    };

    const orders = await this.prismaService.order.findMany({
      where,
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
      take: args.first || 10,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
    });

    if (!orders.length) {
      throw new NotFoundException('No orders found');
    }

    const totalCount = await this.prismaService.order.count({ where });

    const startOrder = orders[0];
    const endOrder = orders[orders.length - 1];

    const hasPreviousPage =
      !!(cursorId && startOrder) &&
      (await this.prismaService.order.count({
        where: { ...where, id: { lt: startOrder.id } },
      })) > 0;

    const hasNextPage =
      !!endOrder &&
      (await this.prismaService.order.count({
        where: { ...where, id: { gt: endOrder.id } },
      })) > 0;

    const startCursor = startOrder ? encodeBase64(startOrder.id) : null;
    const endCursor = endOrder ? encodeBase64(endOrder.id) : null;

    return {
      edges: orders.map((order) => ({
        node: order,
        cursor: encodeBase64(order.id),
      })),
      pageInfo: {
        start_cursor: startCursor,
        end_cursor: endCursor,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage,
      },
      totalCount,
    };
  }
}
