import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class VerificationTokenTypesType {
  @Field(() => ID)
  id: number;

  @Field({ name: 'token_type' })
  tokenType: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
