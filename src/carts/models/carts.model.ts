import { Field, ObjectType, ID } from '@nestjs/graphql';
import { CartItem } from './cart.items.model';

@ObjectType()
export class Cart {
  @Field(() => ID)
  id: string;

  @Field(() => [CartItem!]!)
  cartItems: CartItem[];

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
