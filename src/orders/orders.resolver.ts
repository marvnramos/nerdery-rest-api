import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { UseFilters } from '@nestjs/common';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { AddOrderRes } from './dto/responses/add.order.res';
import { AddOrderArgs } from './dto/args/add.order.args';

@Resolver()
export class OrdersResolver {
  constructor(private readonly orderService: OrdersService) {}

  @Auth('CLIENT')
  @Mutation(() => AddOrderRes)
  @UseFilters(new GlobalExceptionFilter())
  async addOrder(
    @Args('data') data: AddOrderArgs,
    @Context('request') { user }: { user: { id: string } },
  ): Promise<AddOrderRes> {
    return this.orderService.addOrder(user.id, data);
  }

  @Query(() => [String])
  Orders(): string[] {
    return ["John's order", "Marta's order"];
  }
}
