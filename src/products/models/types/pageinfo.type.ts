import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field(() => String!, { name: 'start_cursor' })
  startCursor: string;

  @Field(() => String!, { name: 'end_cursor' })
  endCursor: string;

  @Field(() => Boolean!, { name: 'has_next_page' })
  hasNextPage: boolean;

  @Field(() => Boolean!, { name: 'has_previous_page' })
  hasPreviousPage: boolean;
}
