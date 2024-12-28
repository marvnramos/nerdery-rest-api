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
import { plainToClass, plainToInstance } from 'class-transformer';
import { RemoveProductFromCartArgs } from './dto/args/remove.product.from.cart.args';
import { RemoveProductFromCartRes } from './dto/response/remove.product.from.cart.res';
import { Cart as CartType } from './models/carts.model';
import { CartItem as CartItemType } from './models/cart.items.model';

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

  async getCartByUserId(userId: string): Promise<CartType> {
    const cart = await this.prismaService.cart.findUnique({
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

    return plainToClass(CartType, {
      ...cart,
      createdAt: cart.created_at,
      updatedAt: cart.updated_at,
      cartItems: cart.cart_items.map((item) => ({
        ...item,
        product: item.product,
      })),
    });
  }

  async getCartItemsByCartId(cartId: string): Promise<CartItemType[]> {
    const cartItems = await this.prismaService.cartItem.findMany({
      where: { cart_id: cartId },
      include: {
        product: {
          include: {
            categories: {
              select: {
                category: { select: { id: true, category_name: true } },
              },
            },
            images: {
              select: {
                id: true,
                image_url: true,
                public_id: true,
              },
            },
          },
        },
      },
    });

    return plainToInstance(
      CartItemType,
      cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product: {
          id: item.product.id,
          productName: item.product.product_name,
          description: item.product.description,
          stock: item.product.stock,
          isAvailable: item.product.is_available,
          unitPrice: item.product.unit_price,
          categories: item.product.categories.map((relation) => ({
            id: relation.category.id,
            categoryName: relation.category.category_name,
          })),
          images: item.product.images.map((image) => ({
            id: image.id,
            image_url: image.image_url,
            public_id: image.public_id,
          })),
          createdAt: item.product.created_at,
          updatedAt: item.product.updated_at,
        },
      })),
    );
  }
}
