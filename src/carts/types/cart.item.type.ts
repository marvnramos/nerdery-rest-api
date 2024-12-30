import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ProductType } from '../../products/types/product.type';

@ObjectType()
export class CartItemType {
  @Field(() => ID)
  id: string;

  @Field(() => ProductType)
  product: ProductType;

  @Field()
  quantity: number;

  @Field(() => Date, { name: 'created_at' })
  created_at: Date;

  @Field(() => Date, { name: 'updated_at' })
  updated_at: Date;
}
