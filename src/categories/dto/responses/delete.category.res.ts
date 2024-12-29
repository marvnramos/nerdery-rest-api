import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@ObjectType()
export class DeleteCategoryRes {
  @Field(() => Date, { name: 'deleted_at' })
  @Expose({ name: 'deleted_at' })
  deletedAt: Date;
}
