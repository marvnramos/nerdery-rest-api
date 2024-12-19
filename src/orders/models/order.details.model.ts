import { ObjectType, ID, Field } from '@nestjs/graphql';

@ObjectType()
export class OrderDetail {
  @Field(() => ID)
  id: string;

  @Field()
  order_id: string;

  @Field()
  product_id: string;

  @Field()
  quantity: number;

  @Field()
  unitPrice: number;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}
