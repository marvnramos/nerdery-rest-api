import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ProductType } from '../../products/types/product.type';
import { Expose } from 'class-transformer';

@ObjectType()
export class CartItemType {
  @Field(() => ID)
  id: string;

  @Field(() => ProductType)
  product: ProductType;

  @Field()
  quantity: number;

  @Field(() => Date, { name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date, { name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
