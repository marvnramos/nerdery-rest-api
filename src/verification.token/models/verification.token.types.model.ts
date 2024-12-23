import { Field, ObjectType, ID } from '@nestjs/graphql';
import { VerificationTokens } from './verification.tokens.model';

@ObjectType()
export class VerificationTokenTypes {
  @Field(() => ID)
  id: number;

  @Field({ name: 'token_type' })
  tokenType: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => [VerificationTokens], { nullable: true })
  verificationTokens?: VerificationTokens[];
}
