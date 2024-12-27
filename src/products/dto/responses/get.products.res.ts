import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { Product } from 'src/products/models/products.model';
import { PageInfo } from 'src/products/models/types/pageinfo.type';
import { ProductEdge } from 'src/products/models/types/product.edge.type';

@ObjectType()
export class GetProductsRes {
  @Field(() => Int!, { name: 'total_count' })
  @Expose({ name: 'total_count' })
  totalCount: number;

  @Field(() => [ProductEdge], { nullable: true })
  edges?: ProductEdge[];

  @Field(() => [Product], { nullable: true })
  nodes?: Product[];

  @Field(() => PageInfo!)
  pageInfo: PageInfo;
}
