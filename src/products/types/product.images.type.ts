import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@ObjectType()
export class ProductImagesType {
  @Field(() => ID)
  @Expose()
  id: string;

  @Field({ name: 'product_id' })
  product_id: string;

  @Field({ name: 'image_url' })
  image_url: string;

  @Field({ name: 'public_id' })
  public_id: string;

  @Field({ name: 'created_at' })
  created_at: Date;

  @Field({ name: 'updated_at' })
  updated_at: Date;
}
