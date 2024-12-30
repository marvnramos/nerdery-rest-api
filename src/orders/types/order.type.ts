import { ObjectType, Field, ID } from '@nestjs/graphql';
import { OrderDetailType } from './order.detail.type';
import { User } from '../../users/models/users.model';
import { Expose } from "class-transformer";

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  user_id: string;

  @Field(() => String)
  address: string;

  @Field(() => String)
  nearby_landmark: string;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => User, { nullable: true })
  user?: User | null;

  @Field(() => [OrderDetailType!])
  order_details: OrderDetailType[];
}
