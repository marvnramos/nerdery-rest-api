import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CartItems {
  @Field(() => ID)
  id: string;

  @Field({ name: 'cart_id' })
  cartId: string;

  @Field({ name: 'product_id' })
  productId: string;

  @Field()
  quantity: number;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
