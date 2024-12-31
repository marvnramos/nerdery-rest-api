import {
  Controller,
  Post,
  Body,
  UseFilters,
  Req,
  Res,
  Request as RequestDecorator,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { AddPaymentReq } from './dto/requests/add.payment.req';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { Request, Response } from 'express';

@UseFilters(GlobalExceptionFilter)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Auth('CLIENT')
  @Post()
  async createPayment(
    @Body() req: AddPaymentReq,
    @RequestDecorator() { user }: any,
  ): Promise<void> {
    await this.paymentService.createPaymentIntent(req.orderId, user);
  }

  @Post('webhook')
  async stripeWebhook(@Req() req: Request, @Res() res: Response) {
    return this.paymentService.handleStripeWebhook(req, res);
  }
}
