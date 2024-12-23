import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field({ name: 'product_name' })
  productName: string;

  @Field()
  description: string;

  @Field()
  stock: number;

  @Field({ name: 'is_available' })
  isAvailable: boolean;

  @Field({ name: 'unit_price' })
  unitPrice: number;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
