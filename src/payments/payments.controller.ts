import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Post()
  async createPayment(
    @Body('orderId') orderId: string,
    @Body('amount') amount: number,
  ) {
    return this.paymentService.createPaymentIntent(orderId, amount);
  }
}
