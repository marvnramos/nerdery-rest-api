import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class Cart {
  @Field(() => ID)
  id: string;

  @Field({ name: 'user_id' })
  userId: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
