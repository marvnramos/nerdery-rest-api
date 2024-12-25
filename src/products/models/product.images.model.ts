import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductImages {
  @Field(() => ID)
  id: string;

  @Field({ name: 'product_id' })
  productId: string;

  @Field({ name: 'image_url' })
  imageUrl: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
