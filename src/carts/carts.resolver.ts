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
import { GlobalExceptionFilter } from '../../utils/exception/GlobalExceptionFilter';
import { AddOrUpdateProductCartArgs } from './dto/args/add.or.update.product.cart.args';
import { UpdateProductCartRes } from './dto/response/update.product.cart.res';
import { RemoveProductFromCartArgs } from './dto/args/remove.product.from.cart.args';
import { RemoveProductFromCartRes } from './dto/response/remove.product.from.cart.res';
import { CartType } from './types/cart.type';
import { CartItemType } from './types/cart.item.type';
import { UserRoleType } from '@prisma/client';

@Resolver(() => CartType)
@UseFilters(new GlobalExceptionFilter())
export class CartsResolver {
  constructor(private readonly cartsService: CartsService) {}

  @Auth(UserRoleType.CLIENT)
  @Mutation(() => UpdateProductCartRes)
  async addOrUpdateCartProduct(
    @Args('data') data: AddOrUpdateProductCartArgs,
    @Context('request') req: any,
  ): Promise<UpdateProductCartRes> {
    const userId = req.user.id;
    return this.cartsService.addProductToCart(userId, data);
  }

  @Auth(UserRoleType.CLIENT)
  @Mutation(() => RemoveProductFromCartRes)
  async removeProductFromCart(
    @Args('data') data: RemoveProductFromCartArgs,
    @Context('request') req: any,
  ): Promise<RemoveProductFromCartRes> {
    const userId = req.user.id;
    return this.cartsService.deleteProductFromCart(userId, data);
  }

  @Auth(UserRoleType.CLIENT)
  @Query(() => CartType)
  async getCarts(@Context('request') req: any): Promise<CartType> {
    const userId = req.user.id;
    return this.cartsService.getCartByUserId(userId);
  }

  @ResolveField(() => [CartItemType])
  async cartItems(@Parent() cart: CartType): Promise<CartItemType[]> {
    return this.cartsService.getCartItemsByCartId(cart.id);
  }
}
