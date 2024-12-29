import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Categories } from 'src/categories/models/categories.model';
import { ProductImagesType } from './product.images.type';
import { Expose, Type } from 'class-transformer';

@ObjectType()
export class ProductType {
  @Field(() => ID)
  @Expose()
  id: string;

  @Field({ name: 'product_name' })
  @Expose({ name: 'product_name' })
  productName: string;

  @Field()
  @Expose()
  description: string;

  @Field()
  @Expose()
  stock: number;

  @Field({ name: 'is_available' })
  @Expose({ name: 'is_available' })
  isAvailable: boolean;

  @Field({ name: 'unit_price' })
  @Expose({ name: 'unit_price' })
  unitPrice: number;

  @Field(() => [Categories])
  @Type(() => Categories)
  @Expose()
  categories: Categories[];

  @Field(() => [ProductImagesType])
  @Type(() => ProductImagesType)
  @Expose()
  images: ProductImagesType[];

  @Field({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
