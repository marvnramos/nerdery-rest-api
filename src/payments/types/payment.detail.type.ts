import { Field, ObjectType, ID } from '@nestjs/graphql';
import { PaymentStatus } from './status.payment.type';

@ObjectType()
export class PaymentDetail {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  payment_intent_id: string;

  @Field(() => String)
  payment_method_id: string;

  @Field(() => String)
  order_id: string;

  @Field()
  amount: number;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  @Field()
  payment_date: Date;
}
