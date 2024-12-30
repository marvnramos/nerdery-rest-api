import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { UseFilters } from '@nestjs/common';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { AddOrderRes } from './dto/responses/add.order.res';
import { AddOrderArgs } from './dto/args/add.order.args';
import { GetOrdersArgs } from './dto/args/get.orders.args';
import { OrderDetailType } from './types/order.detail.type';
import { PaginatedOrdersType } from './types/orders.connection.type';
import { UserRoleType } from '@prisma/client';

@Resolver(() => OrderDetailType)
@UseFilters(new GlobalExceptionFilter())
export class OrdersResolver {
  constructor(private readonly orderService: OrdersService) {}

  @Auth('CLIENT')
  @Mutation(() => AddOrderRes)
  async addOrder(
    @Args('data') data: AddOrderArgs,
    @Context('request') { user }: { user: { id: string } },
  ): Promise<AddOrderRes> {
    return this.orderService.addOrder(user.id, data);
  }

  @Auth('CLIENT')
  @Query(() => [String])
  Orders(@Context('request') request: any): string[] {
    console.log(request);
    return ["John's order", "Marta's order"];
  }

  @Auth('CLIENT', 'MANAGER')
  @Query(() => PaginatedOrdersType)
  async getPaginatedOrders(
    @Args('data') args: GetOrdersArgs,
    @Context('request') request: any,
  ) {
    if (request.user.role === UserRoleType.CLIENT) {
      args.userId = request.user.id;
    }
    return this.orderService.getPaginatedOrders(args);
  }
}
