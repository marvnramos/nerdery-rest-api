import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class PaymentDetail {
  @Field(() => ID)
  id: string;

  @Field({ name: 'payment_intent_id' })
  paymentIntentId: string;

  @Field({ name: 'payment_method_id' })
  paymentMethodId: string;

  @Field({ name: 'order_id' })
  orderId: string;

  @Field()
  amount: number;

  @Field({ name: 'status_id' })
  statusId: number;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;

  @Field({ name: 'payment_date' })
  paymentDate: string;
}
