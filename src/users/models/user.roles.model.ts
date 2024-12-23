import { Field, ObjectType, ID } from '@nestjs/graphql';
import { User } from './users.model';

@ObjectType()
export class UserRoles {
  @Field(() => ID)
  id: number;

  @Field()
  role: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => [User], { nullable: true })
  users?: User[];
}
