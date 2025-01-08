import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import DataLoader from 'dataloader';
import { OrderDetailType } from '../orders/types/order.detail.type';
import { PaymentDetail } from '../payments/types/payment.detail.type';

@Injectable()
export class DataLoaderService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  getLoaders() {
    const orderDetailsLoader = this._createOrderDetailsLoader();
    const paymentLoader = this._createPaymentDetailsLoader();
    return {
      orderDetailsLoader,
      paymentLoader,
    };
  }

  private _createOrderDetailsLoader() {
    return new DataLoader<string, OrderDetailType>(
      async (keys: readonly string[]) =>
        await this.ordersService.getOrderDetailsByBatch(keys as string[]),
    );
  }

  private _createPaymentDetailsLoader() {
    return new DataLoader<string, PaymentDetail>(
      async (keys: readonly string[]) =>
        await this.paymentsService.getPaymentDetailsByBatch(keys as string[]),
    );
  }
}
