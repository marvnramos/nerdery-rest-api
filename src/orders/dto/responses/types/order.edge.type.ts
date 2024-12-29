import { Field, ObjectType } from '@nestjs/graphql';
import { OrderType } from '../../../types/order.type';
import { Expose, Type } from 'class-transformer';

@ObjectType()
export class OrderEdgeType {
  @Field(() => String)
  @Expose()
  cursor: string;

  @Field(() => OrderType)
  @Type(() => OrderEdgeType)
  @Expose()
  node: OrderType;
}
