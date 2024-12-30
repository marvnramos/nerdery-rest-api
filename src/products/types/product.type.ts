import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Categories } from 'src/categories/models/categories.model';
import { ProductImagesType } from './product.images.type';
import { Type } from 'class-transformer';

@ObjectType()
export class ProductType {
  @Field(() => ID)
  id: string;

  @Field()
  product_name: string;

  @Field()
  description: string;

  @Field()
  stock: number;

  @Field()
  is_available: boolean;

  @Field()
  unit_price: number;

  @Field(() => [Categories])
  @Type(() => Categories)
  categories: Categories[];

  @Field(() => [ProductImagesType])
  images: ProductImagesType[];

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}
