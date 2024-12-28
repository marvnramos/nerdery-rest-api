import { ObjectType, Field, ID } from '@nestjs/graphql';

ObjectType();
export class FavoriteType {
  @Field(() => ID)
  id: string;

  @Field({ name: 'user_id' })
  userId: string;

  @Field({ name: 'product_id' })
  productId: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
