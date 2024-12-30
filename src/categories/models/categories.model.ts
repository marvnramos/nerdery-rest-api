import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@ObjectType()
export class Categories {
  @Field(() => ID)
  id: number;

  @Field({ name: 'category_name' })
  category_name: string;

  @Field({ name: 'created_at' })
  created_at: Date;

  @Field({ name: 'updated_at' })
  updated_at: Date;
}
