import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class VerificationTokens {
  @Field(() => ID)
  id: string;

  @Field()
  token: string;

  @Field({ name: 'user_id' })
  userId: string;

  @Field({ name: 'token_type_id' })
  tokenTypeId: number;

  @Field({ name: 'is_used' })
  isUsed: string;

  @Field({ name: 'expired_at' })
  expiredAt: Date;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
