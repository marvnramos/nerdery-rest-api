import { Injectable, NotAcceptableException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { OrdersService } from 'src/orders/orders.service';
import { AddPaymentRes } from './dto/responses/add.payment.res';
import { UserRoleType } from '@prisma/client';
import { WebhookReq } from './dto/requests/webhook.req';

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

  async createPaymentIntent(
    orderId: string,
    user: { id: string; role: UserRoleType },
  ): Promise<AddPaymentRes> {
    const orderAlreadyPaid = await this.prisma.paymentDetail.findFirst({
      where: { order_id: orderId },
    });

    if (orderAlreadyPaid) {
      throw new NotAcceptableException('This order has already been paid.');
    }
    const order = await this.orderService.getOrderById(orderId, user);
    const amount = order.orderDetails.reduce((amount, orderDetail) => {
      amount += orderDetail.quantity * orderDetail.unit_price;
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

  async handleStripeWebhook(data: WebhookReq) {
    const { id, status, amount, payment_method, order_id } = data;

    const statusPayment = status === 'succeeded' ? 2 : 3;
    return this.prisma.paymentDetail.update({
      where: {
        order_id: order_id || undefined,
        payment_intent_id: id,
      },
      data: {
        payment_method_id: payment_method ?? 'not provided',
        amount: parseInt(amount),
        status_id: statusPayment,
        updated_at: new Date(),
        payment_date: new Date(),
      },
    });
  }
}
