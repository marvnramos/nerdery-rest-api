import {
  Mutation,
  Resolver,
  Args,
  Context,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { CartsService } from './carts.service';
import { Auth } from 'src/auth/decorators/auth.role.decorator';
import { UseFilters } from '@nestjs/common';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { AddOrUpdateProductCartArgs } from './dto/args/add.or.update.product.cart.args';
import { UpdateProductCartRes } from './dto/response/update.product.cart.res';
import { RemoveProductFromCartArgs } from './dto/args/remove.product.from.cart.args';
import { RemoveProductFromCartRes } from './dto/response/remove.product.from.cart.res';
import { Cart } from './models/carts.model';
import any = jasmine.any;
import { CartItem } from './models/cart.items.model';
import { ProductsService } from '../products/products.service';
import { plainToInstance } from 'class-transformer';
import { Stripe } from 'stripe';
import Product from '../products/models/products.model';

@Resolver(() => Cart)
export class CartsResolver {
  constructor(
    private readonly cartsService: CartsService,
    private readonly productsService: ProductsService,
  ) {}

  @Auth('CLIENT')
  @Mutation(() => UpdateProductCartRes)
  @UseFilters(new GlobalExceptionFilter())
  async addOrUpdateCartProduct(
    @Args('data')
    addOrRemoveProductQuantityCartArg: AddOrUpdateProductCartArgs,
    @Context('request') req: any,
  ): Promise<UpdateProductCartRes> {
    return this.cartsService.addProductToCart(
      req.user.id,
      addOrRemoveProductQuantityCartArg,
    );
  }

  @Auth('CLIENT')
  @Mutation(() => RemoveProductFromCartRes)
  @UseFilters(new GlobalExceptionFilter())
  async removeProductFromCart(
    @Args('data')
    removeProductFromCartArg: RemoveProductFromCartArgs,
    @Context('request') req: any,
  ): Promise<RemoveProductFromCartRes> {
    return this.cartsService.deleteProductFromCart(
      req.user.id,
      removeProductFromCartArg,
    );
  }

  @Auth('CLIENT')
  @Mutation(() => Cart)
  @UseFilters(new GlobalExceptionFilter())
  async getCartDetails(
    @Context('request') req: any,
  ): Promise<void> {
    return this.cartsService.getCartDetails(req.user.id);
  }

  @ResolveField(() => [CartItem])
  async cartItems(@Parent() cart: Cart): Promise<CartItem[]> {
    const cartItems = await this.cartsService.getCartItems(cart.id);

    return Promise.all(
      cartItems.map(async (item) => {
        const cartItem = new CartItem();

        cartItem.id = item.id;
        cartItem.quantity = item.quantity;
        cartItem.createdAt = item.created_at;
        cartItem.updatedAt = item.updated_at;

        const product = await this.productsService.findProductById(item.product_id);
        cartItem.product = plainToInstance(Product, product);

        return cartItem;
      }),
    );
  }

}
