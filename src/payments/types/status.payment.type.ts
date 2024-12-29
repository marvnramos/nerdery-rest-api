import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class PaymentStatus {
  @Field(() => ID)
  id: number;

  @Field()
  status: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;
}
