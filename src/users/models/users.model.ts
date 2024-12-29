import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field({ name: 'first_name' })
  firstName: string;

  @Field({ name: 'last_name' })
  lastName: string;

  @Field()
  email: string;

  @Field({ name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Field({ name: 'role_id' })
  roleId: number;

  @Field()
  address: string;

  @Field()
  password: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
