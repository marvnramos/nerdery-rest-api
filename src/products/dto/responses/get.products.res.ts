import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { ProductType } from 'src/products/types/product.type';
import { PageInfoType } from 'src/products/types/pageinfo.type';
import { ProductEdgeType } from 'src/products/types/product.edge.type';

@ObjectType()
export class GetProductsRes {
  @Field(() => Int!, { name: 'total_count' })
  @Expose({ name: 'total_count' })
  totalCount: number;

  @Field(() => [ProductEdgeType], { nullable: true })
  edges?: ProductEdgeType[];

  @Field(() => [ProductType], { nullable: true })
  nodes?: ProductType[];

  @Field(() => PageInfoType!)
  pageInfo: PageInfoType;
}
