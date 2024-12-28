import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
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
import { ProductsService } from '../products/products.service';
import { CartItem } from './models/cart.items.model';

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
  @Query(() => Cart)
  @UseFilters(new GlobalExceptionFilter())
  async getCarts(@Context('request') req: any): Promise<Cart> {
    return await this.cartsService.getCartByUserId(req.user.id);
  }

  @ResolveField(() => [CartItem])
  async cartItems(@Parent() cart: Cart): Promise<CartItem[]> {
    return await this.cartsService.getCartItemsByCartId(cart.id);
  }
}
