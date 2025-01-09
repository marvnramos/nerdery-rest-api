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
import { GlobalExceptionFilter } from '../../utils/exception/GlobalExceptionFilter';
import { AddPaymentReq } from './dto/requests/add.payment.req';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { Request, Response } from 'express';
import { AddPaymentRes } from './dto/responses/add.payment.res';
import { UserRoleType } from '@prisma/client';

@UseFilters(GlobalExceptionFilter)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Auth(UserRoleType.CLIENT)
  @Post()
  async createPayment(
    @Body() req: AddPaymentReq,
    @RequestDecorator() { user }: any,
  ): Promise<AddPaymentRes> {
    return this.paymentService.createPaymentIntent(req.orderId, user);
  }

  @Post('webhook')
  async stripeWebhook(@Req() req: Request, @Res() res: Response) {
    return this.paymentService.handleStripeWebhook(req, res);
  }
}
