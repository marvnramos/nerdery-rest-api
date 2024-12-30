import { Controller, Post, Body, UseFilters, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { AddPaymentReq } from './dto/requests/add.payment.req';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { plainToInstance } from 'class-transformer';
import { WebhookReq } from './dto/requests/webhook.req';

@UseFilters(GlobalExceptionFilter)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Auth('CLIENT')
  @Post()
  async createPayment(
    @Body() req: AddPaymentReq,
    @Request() { user }: any,
  ): Promise<void> {
    await this.paymentService.createPaymentIntent(req.orderId, user);
  }

  @Post('webhook')
  async stripeWebhook(@Body() body: any) {
    const paymentData = {
      id: body.data.object.id,
      status: body.data.object.status,
      amount: body.data.object.amount,
      payment_method: body.data.object.payment_method,
      order_id: body.data.object.metadata?.orderId,
    };
    const dataFormatted = plainToInstance(WebhookReq, paymentData);
    return this.paymentService.handleStripeWebhook(dataFormatted);
  }
}
