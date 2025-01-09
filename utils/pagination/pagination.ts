import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { PageInfoType } from './pageinfo.type';

/**
 * Generates a paginated GraphQL type with cursor-based pagination support.
 * This utility function defines two nested types: `EdgeType` and `PaginatedType`.
 * `EdgeType` represents a single edge in pagination (cursor and node), while
 * `PaginatedType` represents the overall paginated result set with metadata.
 *
 * @param {Type<TItem>} TItemClass - The class type representing the item in the paginated list.
 * This should be a valid GraphQL object type decorated with `@ObjectType()`.
 *
 * @response {Type<PaginatedType>} - Returns a dynamically generated paginated GraphQL type.
 * The returned type includes:
 * - `edges`: An array of edges (`EdgeType`), where each edge contains a cursor and a node.
 * - `nodes`: An array of items (`TItem`) without cursor information.
 * - `pageInfo`: Metadata about pagination (e.g., cursors, hasNextPage).
 * - `totalCount`: Total number of items across all pages.
 */
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
