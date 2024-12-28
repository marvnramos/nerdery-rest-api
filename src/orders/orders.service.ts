import { Injectable, NotAcceptableException } from '@nestjs/common';
import { PrismaService } from '../utils/prisma/prisma.service';
import { AddOrderArgs } from './dto/args/add.order.args';
import { AddOrderRes } from './dto/responses/add.order.res';
import { CartsService } from '../carts/carts.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { plainToInstance } from 'class-transformer';

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
