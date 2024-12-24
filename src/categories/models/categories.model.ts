import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@ObjectType()
export class Categories {
  @Field(() => ID)
  id: number;

  @Field({ name: 'category_name' })
  @Expose({ name: 'category_name' })
  categoryName: string;

  @Field({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
