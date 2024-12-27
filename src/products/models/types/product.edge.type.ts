import { Field, ObjectType } from '@nestjs/graphql';
import { Product } from '../products.model';

@ObjectType()
export class ProductEdge {
  @Field(() => String!)
  cursor: string;

  @Field(() => Product)
  node: Product;
}
