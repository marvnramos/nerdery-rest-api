import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ProductType } from '../../products/types/product.type';
import { Expose } from 'class-transformer';

@ObjectType()
export class FavoriteType {
  @Field(() => ID)
  id: string;

  @Field({ name: 'user_id' })
  @Expose({ name: 'user_id' })
  userId: string;

  @Field({ name: 'product_id' })
  @Expose({ name: 'product_id' })
  productId: string;

  @Field(() => ProductType)
  product: ProductType;

  @Field({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
