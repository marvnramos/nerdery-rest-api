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
import { RemoveProductFromCartArgs } from './dto/args/remove.product.from.cart.args';
import { RemoveProductFromCartRes } from './dto/response/remove.product.from.cart.res';

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

  async deleteProductFromCart(
    userId: string,
    data: RemoveProductFromCartArgs,
  ): Promise<RemoveProductFromCartRes> {
    await this.productService.findProductById(data.productId);
    const cart = await this.findCartById(data.cartId);

    if (cart.user_id !== userId) {
      throw new NotAcceptableException('Cart not belongs to user');
    }

    await this.prismaService.cartItem
      .delete({
        where: {
          cart_id_product_id: {
            cart_id: data.cartId,
            product_id: data.productId,
          },
        },
      })
      .catch(() => {
        throw new NotFoundException('Product not found in cart');
      });

    const response = new RemoveProductFromCartRes();
    response.deletedAt = new Date();
    return response;
  }

  async findCartById(cartId: string): Promise<Cart> {
    const cart = await this.prismaService.cart.findUnique({
      where: { id: cartId },
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }

  async getCartDetails(userId: string) {
    return this.prismaService.cart.findUnique({
      where: { user_id: userId },
      include: {
        cart_items: {
          include: {
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

    // const productIds = await this.prismaService.cartItem.findMany({
    //   where: { cart: { user_id: userId } },
    //   select: { product_id: true },
    // });
    // const filterIds = productIds.map((item) => item.product_id);
    // const products =
    //   await this.productService.getProductsFilteredByIds(filterIds);
    //
    // console.log(products);
  }

  async getCartItems(cartId: string): Promise<CartItem[]> {
    return this.prismaService.cartItem.findMany({
      where: { cart_id: cartId },
    });
  }
}
