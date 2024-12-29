import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/utils/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_API_KEY'), {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createPaymentIntent(orderId: string, amount: number) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: { orderId },
      });

      // await this.prisma.paymentDetail.create({
      //   data: {
      //     id: paymentIntent.id,
      //     payment_intent_id: paymentIntent.id,
      //     payment_method_id: null,
      //     order_id: orderId,
      //     amount,
      //     status_id: 1,
      //     payment_date: new Date(),
      //   },
      // });

      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      throw new Error(`Error creating payment intent: ${error.message}`);
    }
  }

  async handleStripeWebhook(body: any) {}
}
