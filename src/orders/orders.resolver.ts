import { Args, Context, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { UseFilters } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../utils/exception/GlobalExceptionFilter';
import { AddOrderRes } from './dto/responses/add.order.res';
import { AddOrderArgs } from './dto/args/add.order.args';
import { GetOrdersArgs } from './dto/args/get.orders.args';
import { OrderDetailType } from './types/order.detail.type';
import { PaginatedOrdersType } from './dto/responses/orders.pagination.type.res';
import { GetOrderArgs } from './dto/args/get.order.args';
import { OrderType } from './types/order.type';
import { UserRoleType } from '@prisma/client';

@Resolver(() => OrderType)
@UseFilters(new GlobalExceptionFilter())
export class OrdersResolver {
  constructor(private readonly orderService: OrdersService) {}

  @Auth(UserRoleType.CLIENT)
  @Mutation(() => AddOrderRes)
  async addOrder(
    @Args('data') data: AddOrderArgs,
    @Context('request') { user }: { user: { id: string } },
  ): Promise<AddOrderRes> {
    return this.orderService.addOrder(user.id, data);
  }

  @Auth(UserRoleType.CLIENT, UserRoleType.MANAGER)
  @Query(() => OrderType)
  getOrderById(@Args('data') args: GetOrderArgs, @Context('request') req: any) {
    return this.orderService.getOrderById(args.orderId, req.user);
  }

  @Auth(UserRoleType.CLIENT, UserRoleType.MANAGER)
  @Query(() => PaginatedOrdersType)
  async getPaginatedOrders(
    @Args('data') args: GetOrdersArgs,
    @Context('request') request: any,
  ) {
    return this.orderService.getPaginatedOrders(args, request.user);
  }

  @ResolveField()
}
