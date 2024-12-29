import { ObjectType, Field, ID } from '@nestjs/graphql';
import { OrderDetailType } from './order.detail.type';
import { Expose, Type } from 'class-transformer';

@ObjectType()
export class OrderType {
  @Field(() => ID)
  @Expose()
  id: string;

  @Field(() => ID, { name: 'user_id' })
  @Expose({ name: 'user_id' })
  @Expose()
  userId: string;

  @Field()
  @Expose()
  address: string;

  @Field({ name: 'nearby_landmark' })
  @Expose({ name: 'nearby_landmark' })
  @Expose()
  nearbyLandmark: string;

  @Field({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  @Expose()
  createdAt: Date;

  @Field({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  @Expose()
  updatedAt: Date;

  @Field(() => [OrderDetailType!])
  @Type(() => OrderDetailType)
  @Expose()
  orderDetails: OrderDetailType[];
}
