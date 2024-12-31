import { Field, ObjectType, ID } from '@nestjs/graphql';
import { CartItemType } from './cart.item.type';

@ObjectType()
export class CartType {
  @Field(() => ID)
  id: string;

  @Field(() => [CartItemType!]!, { name: 'cart_item' })
  cart_items: CartItemType[];

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}
