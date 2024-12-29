import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Expose, Type } from 'class-transformer';
import { ProductType } from '../../products/types/product.type';

@ObjectType()
export class OrderDetailType {
  @Field(() => String)
  id: string;

  @Field(() => String, { name: 'order_id' })
  @Expose({ name: 'order_id' })
  orderId: string;

  @Field(() => String, { name: 'product_id' })
  @Expose({ name: 'product_id' })
  productId: string;

  @Field(() => Int)
  @Expose()
  quantity: number;

  @Field(() => Int, { name: 'unit_price' })
  @Expose({ name: 'unit_price' })
  unitPrice: number;

  @Field({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => ProductType)
  @Type(() => ProductType)
  @Expose()
  product: ProductType;
}
