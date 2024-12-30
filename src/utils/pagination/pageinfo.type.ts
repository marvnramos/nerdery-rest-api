import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfoType {
  @Field(() => String, { name: 'start_cursor', nullable: true })
  startCursor?: string;

  @Field(() => String, { name: 'end_cursor', nullable: true })
  endCursor?: string;

  @Field(() => Boolean!, { name: 'has_next_page' })
  hasNextPage: boolean;

  @Field(() => Boolean!, { name: 'has_previous_page' })
  hasPreviousPage: boolean;
}
