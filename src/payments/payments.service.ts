import {
  HttpException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../utils/prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AddPaymentRes } from './dto/responses/add.payment.res';
import { UserRoleType } from '@prisma/client';
import { MailService } from '../mailer/mail.service';
import { EmailCommand } from '../mailer/dto/email.command';
import { Request, Response } from 'express';
import { EnvsConfigService } from '../config/envs.config.service';
import { mapResultToIds } from '../utils/tools';
import { PaymentDetail } from './types/payment.detail.type';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrdersService,
    private readonly mailService: MailService,
    private readonly envsConfigService: EnvsConfigService,
  ) {
    this.webhookSecret = this.envsConfigService.getStripeWebhookSecret();
    const stripeAPIKey = envsConfigService.getStripeAPIKey();

    this.stripe = new Stripe(stripeAPIKey, {
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

    order.orderDetails.forEach((orderDetail) => {
      if (!orderDetail.product_id) {
        throw new HttpException(
          `Missing product ID for order detail: ${JSON.stringify(orderDetail)}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    });

    const amount = order.orderDetails.reduce((total, orderDetail) => {
      return total + orderDetail.quantity * orderDetail.unit_price;
    }, 0);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { orderId },
    });

    await Promise.all([
      this.updateStockAndNotify(order, user.id),
      this.prisma.paymentDetail.create({
        data: {
          payment_intent_id: paymentIntent.id,
          payment_method_id: paymentIntent.payment_method_types.join(','),
          order: { connect: { id: orderId } },
          amount,
          status: { connect: { id: 1 } },
          payment_date: new Date(),
        },
      }),
    ]);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  async handleStripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    try {
      const event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        this.webhookSecret,
      );

      await this.processEvent(event);

      res.status(HttpStatus.OK).send({ received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      throw new HttpException(
        'Webhook verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getPaymentDetailsByBatch(
    orderIds: readonly string[],
  ): Promise<(PaymentDetail | any)[]> {
    const paymentDetail = await this.prisma.paymentDetail.findMany({
      where: { order_id: { in: [...orderIds] } },
    });

    return mapResultToIds(orderIds, paymentDetail);
  }

  private async processEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event);
        break;

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const paymentMethod =
      typeof paymentIntent.payment_method === 'string'
        ? paymentIntent.payment_method
        : 'not provided';

    await this.updatePaymentDetails(paymentIntent.id, {
      status: 'succeeded',
      amount: paymentIntent.amount,
      payment_method: paymentMethod,
      order_id: paymentIntent.metadata?.orderId,
    });
  }

  private async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const paymentIntentId = paymentIntent.id;
    const paymentMethod =
      typeof paymentIntent.payment_method === 'string'
        ? paymentIntent.payment_method
        : 'not provided';
    const amount = paymentIntent.amount;
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      throw new HttpException(
        'Order ID is missing in the PaymentIntent metadata',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.updatePaymentDetails(paymentIntentId, {
        status: 'failed',
        amount,
        payment_method: paymentMethod,
        order_id: orderId,
      });
    } catch (err) {
      console.error('Failed to update payment details:', err);
      throw new HttpException(
        'Failed to update payment details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async updatePaymentDetails(
    paymentIntentId: string,
    data: {
      status: string;
      amount: number;
      payment_method?: string;
      order_id?: string;
    },
  ) {
    const existingPayment = await this.prisma.paymentDetail.findUnique({
      where: { payment_intent_id: paymentIntentId },
    });

    if (!existingPayment) {
      throw new HttpException(
        `Payment record not found for paymentIntentId: ${paymentIntentId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const statusPayment = data.status === 'succeeded' ? 2 : 3;

    return this.prisma.paymentDetail.update({
      where: { id: existingPayment.id },
      data: {
        payment_method_id: data.payment_method ?? 'not provided',
        amount: data.amount,
        status_id: statusPayment,
        updated_at: new Date(),
        payment_date: new Date(),
      },
    });
  }

  private async updateStockAndNotify(order, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const updatedProducts = await Promise.all(
      order.orderDetails.map(async (orderDetail) => {
        if (!orderDetail.product_id) {
          throw new HttpException(
            `Missing product ID for order detail: ${JSON.stringify(orderDetail)}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        const product = await this.prisma.product.update({
          where: { id: orderDetail.product_id },
          data: {
            stock: { decrement: orderDetail.quantity },
          },
          include: { images: true },
        });

        if (product.stock <= 3) {
          await this.sendLowStockEmail(product, user.email);
        }

        return product;
      }),
    );

    return updatedProducts.map((product) => product.id);
  }

  private async sendLowStockEmail(product: any, email: string) {
    const image =
      product.images?.[0]?.image_url ||
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/1024px-No_image_available.svg.png';

    const data: EmailCommand = {
      email,
      subject: 'Low Stock Alert! 🚨',
      fullName: '',
      template: './product-email',
      productName: product.product_name,
      image,
      unitPrice: this.centsToDollars(product.unit_price),
    };
    await this.mailService.sendEmail(data);
  }

  private centsToDollars(cents: number) {
    const price = (cents / 100).toFixed(2);
    return `$ ${price}`;
  }
}
