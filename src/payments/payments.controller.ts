import { Controller, Post, Body, UseFilters, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { AddPaymentReq } from './dto/requests/add.payment.req';
import { Auth } from '../auth/decorators/auth.role.decorator';

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
    console.log(body);
    return this.paymentService.handleStripeWebhook(body);
  }
}
