import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Order } from '../../orders/models/orders.model';
import { VerificationTokens } from '../../verification.token/models/verification.tokens.model';
import { Cart } from '../../carts/models/carts.model';
import { Favorite } from '../../favorites/models/favorites.models';

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

  @Field(() => [VerificationTokens], { nullable: true })
  verificationTokens?: VerificationTokens[];

  @Field(() => [Cart], { nullable: true })
  carts?: Cart[];

  @Field(() => [Order], { nullable: true })
  orders?: Order[];

  @Field(() => [Favorite], { nullable: true })
  favorites?: Favorite[];
}
