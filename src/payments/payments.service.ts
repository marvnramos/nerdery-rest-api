import { Injectable, NotAcceptableException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { OrdersService } from 'src/orders/orders.service';
import { AddPaymentRes } from './dto/responses/add.payment.res';
import { UserRoleType } from '@prisma/client';
import { WebhookReq } from './dto/requests/webhook.req';
import { MailService } from '../utils/mailer/mail.service';
import { EmailCommand } from '../utils/mailer/dto/email.command';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly orderService: OrdersService,
    private readonly mailService: MailService,
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

  async updateStockAndNotify(order, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const updatedProducts = await Promise.all(
      order.orderDetails.map(async (orderDetail) => {
        const product = await this.prisma.product.update({
          where: { id: orderDetail.product_id },
          data: {
            stock: {
              decrement: orderDetail.quantity,
            },
          },
          include: {
            images: true,
          },
        });

        if (product.stock <= 3) {
          await this.sendLowStockEmail(product, user.email);
          console.log('Low stock email sent');
        }

        return product;
      }),
    );

    const productIds = updatedProducts.map((product) => product.id);
    return productIds;
  }

  private async sendLowStockEmail(product: any, email: string) {
    console.log(product);
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
      unitPrice: product.unit_price,
    };
    await this.mailService.sendEmail(data);
  }
}
