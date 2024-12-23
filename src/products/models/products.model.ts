import { Field, ObjectType, ID } from '@nestjs/graphql';
import { CartItems } from '../../carts/models/cart.items.model';
import { OrderDetail } from '../../orders/models/order.details.model';
import { Favorite } from '../../favorites/models/favorites.models';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field({ name: 'product_name' })
  productName: string;

  @Field()
  description: string;

  @Field()
  stock: number;

  @Field({ name: 'is_available' })
  isAvailable: boolean;

  @Field({ name: 'unit_price' })
  unitPrice: number;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => [CartItems], { nullable: true })
  cartItems?: CartItems[];

  @Field(() => [OrderDetail], { nullable: true })
  orderDetails?: OrderDetail[];

  @Field(() => [Favorite], { nullable: true })
  favorites?: Favorite[];
}
