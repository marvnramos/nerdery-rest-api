import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { AddOrUpdateProductCartArgs } from './dto/args/add.or.update.product.cart.args';
import { UpdateProductCartRes } from './dto/response/update.product.cart.res';
import { ProductsService } from 'src/products/products.service';
import { Cart, CartItem } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CartsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productService: ProductsService,
  ) {}

  async addProductToCart(
    userId: string,
    data: AddOrUpdateProductCartArgs,
  ): Promise<UpdateProductCartRes> {
    const product = await this.productService.findProductById(data.productId);

    if (data.quantity > product.stock) {
      throw new NotAcceptableException('Insufficient product stock');
    }

    let cart: Cart;
    let cartItem: CartItem;

    if (!data.cartId) {
      cart = await this.prismaService.cart.create({
        data: {
          user_id: userId,
        },
      });
    } else {
      cart = await this.findCartById(data.cartId);

      if (cart.user_id !== userId) {
        throw new NotAcceptableException('Cart not belongs to user');
      }
    }

    cartItem = await this.prismaService.cartItem.findUnique({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: data.productId,
        },
      },
    });

    if (cartItem) {
      cartItem = await this.prismaService.cartItem.update({
        where: {
          cart_id_product_id: {
            cart_id: cart.id,
            product_id: data.productId,
          },
        },
        data: { quantity: data.quantity },
      });
    } else {
      cartItem = await this.prismaService.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: data.productId,
          quantity: data.quantity,
        },
      });
    }

    return plainToInstance(UpdateProductCartRes, cartItem);
  }

}
