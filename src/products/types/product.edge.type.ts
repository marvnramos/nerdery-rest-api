import { Field, ObjectType } from '@nestjs/graphql';
import { ProductType } from './product.type';

@ObjectType()
export class ProductEdgeType {
  @Field(() => String!)
  cursor: string;

  @Field(() => ProductType)
  node: ProductType;
}
