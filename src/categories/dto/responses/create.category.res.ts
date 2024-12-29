import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@ObjectType()
export class AddCategoryRes {
  @Field(() => Int!)
  id: number;

  @Field(() => Date!, { name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;
}
