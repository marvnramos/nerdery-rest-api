import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ProductType } from '../../products/types/product.type';

@ObjectType()
export class FavoriteType {
  @Field(() => ID)
  id: string;

  @Field({ name: 'user_id' })
  user_id: string;

  @Field({ name: 'product_id' })
  product_id: string;

  @Field(() => ProductType)
  product: ProductType;

  @Field({ name: 'created_at' })
  created_at: Date;

  @Field({ name: 'updated_at' })
  updated_at: Date;
}
