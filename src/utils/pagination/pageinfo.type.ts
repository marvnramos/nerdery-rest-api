import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfoType {
  @Field(() => String, { name: 'start_cursor', nullable: true })
  start_cursor?: string;

  @Field(() => String, { name: 'end_cursor', nullable: true })
  end_cursor?: string;

  @Field(() => Boolean!, { name: 'has_next_page' })
  has_next_page: boolean;

  @Field(() => Boolean!, { name: 'has_previous_page' })
  has_previous_page: boolean;
}
