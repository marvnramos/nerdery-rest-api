import { ObjectType, Field, ID } from '@nestjs/graphql';
// import { OrderDetail } from 'src/order-details/order-detail.model';
// import { PaymentDetail } from 'src/payments/payment-detail.model';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field()
  user_id: string;

  @Field()
  address: string;

  @Field()
  nearby_landmark: string;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  // @Field(() => [OrderDetail], { nullable: true })
  // orderDetails?: OrderDetail[];
  // @Field(() => [PaymentDetail], { nullable: true })
  // paymentDetails?: PaymentDetail[];
}
