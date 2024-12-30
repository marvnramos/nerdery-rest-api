import { Field, Int, ObjectType } from '@nestjs/graphql';
import { OrderType } from '../../types/order.type';
import { OrderEdgeType } from './types/order.edge.type';
import { PageInfoType } from '../../../utils/pagination/pageinfo.type';
import { Expose } from 'class-transformer';

@ObjectType()
export class GetOrdersRes {
  @Field(() => Int)
  @Expose({ name: 'total_count' })
  @Expose()
  totalCount: number;

  @Field(() => [OrderEdgeType])
  @Expose()
  edges: OrderEdgeType[];

  @Field(() => [OrderType])
  @Expose()
  nodes: OrderType[];

  @Field(() => PageInfoType)
  @Expose({ name: 'page_info' })
  @Expose()
  pageInfo: PageInfoType;
}
