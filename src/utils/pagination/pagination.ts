import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { PageInfoType } from './pageinfo.type';

export default function PaginationType<TItem>(TItemClass: Type<TItem>) {
  @ObjectType(`${TItemClass.name}Edge`)
  abstract class EdgeType {
    @Field(() => String)
    cursor: string;

    @Field(() => TItemClass)
    node: TItem;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [EdgeType], { nullable: true })
    edges: Array<EdgeType>;

    @Field(() => [TItemClass], { nullable: true })
    nodes: Array<TItem>;

    @Field(() => PageInfoType)
    pageInfo: PageInfoType;

    @Field(() => Int)
    totalCount: number;
  }

  return PaginatedType;
}
