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
@UseFilters(new GlobalExceptionFilter())
export class CartsResolver {
  constructor(
    private readonly cartsService: CartsService,
    private readonly productsService: ProductsService,
  ) {}

  @Auth('CLIENT')
  @Mutation(() => UpdateProductCartRes)
  async addOrUpdateCartProduct(
    @Args('data') data: AddOrUpdateProductCartArgs,
    @Context('request') req: any,
  ): Promise<UpdateProductCartRes> {
    const userId = req.user.id;
    return this.cartsService.addProductToCart(userId, data);
  }

  @Auth('CLIENT')
  @Mutation(() => RemoveProductFromCartRes)
  async removeProductFromCart(
    @Args('data') data: RemoveProductFromCartArgs,
    @Context('request') req: any,
  ): Promise<RemoveProductFromCartRes> {
    const userId = req.user.id;
    return this.cartsService.deleteProductFromCart(userId, data);
  }

  @Auth('CLIENT')
  @Query(() => Cart)
  async getCarts(@Context('request') req: any): Promise<Cart> {
    const userId = req.user.id;
    return this.cartsService.getCartByUserId(userId);
  }

  @ResolveField(() => [CartItem])
  async cartItems(@Parent() cart: Cart): Promise<CartItem[]> {
    return this.cartsService.getCartItemsByCartId(cart.id);
  }
}
