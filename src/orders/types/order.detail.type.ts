import { ObjectType, ID, Field } from '@nestjs/graphql';

@ObjectType()
export class OrderDetailType {
  @Field(() => ID)
  id: string;

  @Field({ name: 'order_id' })
  orderId: string;

  @Field({ name: 'product_id' })
  productId: string;

  @Field()
  quantity: number;

  @Field({ name: 'unit_price' })
  unitPrice: number;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
