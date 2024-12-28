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
    this.cartService.validateCartOwnership(cart, user.id);

    const cartItems = await this.prismaService.cartItem.findMany({
      where: { cart_id: args.cartId },
    });

    if (!cartItems || cartItems.length === 0) {
      throw new NotAcceptableException('Cart has no items');
    }

    const order = await this.prismaService.order.create({
      data: {
        address: args.address ? args.address : user.address,
        nearby_landmark: args.nearbyLandmark || 'No landmark provided',
        user_id: user.id,
      },
    });

    const orderDetails = await Promise.all(
      cartItems.map(async (item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: await this.productsService.getProductUnitPrice(
          item.product_id,
        ),
      })),
    );

    await this.prismaService.orderDetail.createMany({
      data: orderDetails,
    });

    await this.prismaService.cartItem.deleteMany({
      where: { cart_id: args.cartId },
    });

    return plainToInstance(AddOrderRes, order);
  }
}
