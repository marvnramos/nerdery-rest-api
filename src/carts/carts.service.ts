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
import { CartType as CartType } from './models/cart.type';
import { CartItemType as CartItemType } from './models/cart.item.type';

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

    const cart = await this.getOrCreateCart(userId, data.cartId);

    const cartItem = await this.upsertCartItem(
      cart.id,
      data.productId,
      data.quantity,
    );

    return plainToInstance(UpdateProductCartRes, cartItem);
  }

  async deleteProductFromCart(
    userId: string,
    data: RemoveProductFromCartArgs,
  ): Promise<RemoveProductFromCartRes> {
    await this.productService.findProductById(data.productId);
    const cart = await this.findCartById(data.cartId);

    this.validateCartOwnership(cart, userId);

    try {
      await this.prismaService.cartItem.delete({
        where: {
          cart_id_product_id: {
            cart_id: data.cartId,
            product_id: data.productId,
          },
        },
      });
    } catch {
      throw new NotFoundException('Product not found in cart');
    }

    return plainToInstance(RemoveProductFromCartRes, { deletedAt: new Date() });
  }

  async getCartByUserId(userId: string): Promise<CartType> {
    const cart = await this.prismaService.cart.findUnique({
      where: { user_id: userId },
      include: this.getCartIncludeRelations(),
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return plainToInstance(CartType, {
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
      include: this.getCartItemIncludeRelations(),
    });

    return plainToInstance(
      CartItemType,
      cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product: this.transformProduct(item.product),
      })),
    );
  }

  private async getOrCreateCart(
    userId: string,
    cartId?: string,
  ): Promise<Cart> {
    if (!cartId) {
      const existingCart = await this.prismaService.cart.findUnique({
        where: { user_id: userId },
      });

      if (existingCart) {
        return existingCart;
      }

      return this.prismaService.cart.create({
        data: {
          user: { connect: { id: userId } },
        },
      });
    }

    const cart = await this.findCartById(cartId);
    this.validateCartOwnership(cart, userId);
    return cart;
  }

  private async upsertCartItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<CartItem> {
    return this.prismaService.cartItem.upsert({
      where: {
        cart_id_product_id: { cart_id: cartId, product_id: productId },
      },
      update: { quantity },
      create: {
        cart_id: cartId,
        product_id: productId,
        quantity,
      },
    });
  }

  private async findCartById(cartId: string): Promise<Cart> {
    const cart = await this.prismaService.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }

  private validateCartOwnership(cart: Cart, userId: string): void {
    if (cart.user_id !== userId) {
      throw new NotAcceptableException('Cart does not belong to the user');
    }
  }

  private transformProduct(product: any): any {
    return {
      id: product.id,
      productName: product.product_name,
      description: product.description,
      stock: product.stock,
      isAvailable: product.is_available,
      unitPrice: product.unit_price,
      categories: product.categories.map((relation) => ({
        id: relation.category.id,
        categoryName: relation.category.category_name,
      })),
      images: product.images.map((image) => ({
        id: image.id,
        image_url: image.image_url,
        public_id: image.public_id,
      })),
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }

  private getCartIncludeRelations() {
    return {
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
    };
  }

  private getCartItemIncludeRelations() {
    return {
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
    };
  }
}
