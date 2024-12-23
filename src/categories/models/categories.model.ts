import { Field, ObjectType, ID } from '@nestjs/graphql';

ObjectType();
export class Categories {
  @Field(() => ID)
  id: string;

  @Field({ name: 'category_name' })
  categoryName: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
