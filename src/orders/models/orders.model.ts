import { ObjectType, Field, ID } from '@nestjs/graphql';
import { OrderDetail } from './order.details.model';
import { PaymentDetail } from 'src/payments/models/payment.details.model';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field({ name: 'user_id' })
  userId: string;

  @Field()
  address: string;

  @Field({ name: 'nearby_landmark' })
  nearbyLandmark: string;

  @Field({ name: 'created_at' })
  createdAt: Date;

  @Field({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => [OrderDetail], { nullable: true })
  orderDetails?: OrderDetail[];
  @Field(() => [PaymentDetail], { nullable: true })
  paymentDetails?: PaymentDetail[];
}
