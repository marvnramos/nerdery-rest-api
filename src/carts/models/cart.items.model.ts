import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Product } from '../../products/models/products.model';

@ObjectType()
export class CartItem {
  @Field(() => ID)
  id: string;

  @Field(() => Product)
  product: Product;

  @Field()
  quantity: number;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
