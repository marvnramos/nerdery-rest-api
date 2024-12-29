import { Controller, Post, Body, UseFilters } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { AddPaymentReq } from './dto/requests/add.payment.req';
import { AddPaymentRes } from './dto/responses/add.payment.res';

@UseFilters(GlobalExceptionFilter)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Post()
  async createPayment(@Body() req: AddPaymentReq): Promise<AddPaymentRes> {
    return this.paymentService.createPaymentIntent(req.orderId);
  }

  @Post('webhook')
  async stripeWebhook(@Body() body: any) {
    console.log(body);
    return this.paymentService.handleStripeWebhook(body);
  }
}
