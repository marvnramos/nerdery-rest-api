import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeleteCategoryRes {
  @Field(() => Date, { name: 'deleted_at' })
  deletedAt: Date;
}
