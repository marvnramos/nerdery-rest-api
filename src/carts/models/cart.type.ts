import { Field, ObjectType, ID } from '@nestjs/graphql';
import { CartItemType } from './cart.item.type';

@ObjectType()
export class CartType {
  @Field(() => ID)
  id: string;

  @Field(() => [CartItemType!]!)
  cartItems: CartItemType[];

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
