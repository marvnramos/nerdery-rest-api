import { Injectable, NotAcceptableException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { OrdersService } from 'src/orders/orders.service';
import { AddPaymentRes } from './dto/responses/add.payment.res';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly orderService: OrdersService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_API_KEY'), {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createPaymentIntent(orderId: string): Promise<AddPaymentRes> {
    const orderAlreadyPaid = await this.prisma.paymentDetail.findFirst({
      where: { order_id: orderId },
    });

    if (orderAlreadyPaid) {
      throw new NotAcceptableException('This order has already been paid.');
    }
    const order = await this.orderService.getOrderById(orderId);
    const amount = order.orderDetails.reduce((amount, orderDetail) => {
      amount += orderDetail.quantity * orderDetail.unitPrice;
      return amount;
    }, 0);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { orderId },
    });

    await this.prisma.paymentDetail.create({
      data: {
        payment_intent_id: paymentIntent.id,
        payment_method_id: paymentIntent.payment_method_types.join(','),
        order: { connect: { id: orderId } },
        amount,
        status: { connect: { id: 1 } },
        payment_date: new Date(),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  async handleStripeWebhook(body: any) {}
}
