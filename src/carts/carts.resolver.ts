import { Mutation, Resolver, Args, Context } from '@nestjs/graphql';
import { CartsService } from './carts.service';
import { Auth } from 'src/auth/decorators/auth.role.decorator';
import { UseFilters } from '@nestjs/common';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { AddOrUpdateProductCartArgs } from './dto/args/add.or.update.product.cart.args';
import { UpdateProductCartRes } from './dto/response/update.product.cart.res';

@Resolver()
export class CartsResolver {
  constructor(private readonly cartsService: CartsService) {}

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
}
