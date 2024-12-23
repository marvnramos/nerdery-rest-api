import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Order } from 'src/orders/models/orders.model';

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

  //   @Field(() => [VerificationToken], { nullable: true })
  //   verificationTokens?: VerificationToken[];
  //   @Fiels(() => [Carts], { nullable: true })
  //   carts?: Carts[];
  @Field(() => [Order], { nullable: true })
  orders?: Order[];
  //   @Field(() => [Favorites], { nullable: true })
  //   favorites?: Favorites[];
}
