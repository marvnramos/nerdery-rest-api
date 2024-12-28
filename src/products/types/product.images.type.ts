import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@ObjectType()
export class ProductImagesType {
  @Field(() => ID)
  id: string;

  @Field({ name: 'product_id' })
  @Expose({ name: 'product_id' })
  productId: string;

  @Field({ name: 'image_url' })
  @Expose({ name: 'image_url' })
  imageUrl: string;

  @Field({ name: 'public_id' })
  @Expose({ name: 'public_id' })
  publicId: string;

  @Field({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
