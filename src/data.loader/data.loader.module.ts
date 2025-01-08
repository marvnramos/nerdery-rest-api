import { Module } from '@nestjs/common';
import { DataLoaderService } from './data.loader.service';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [OrdersModule, PaymentsModule],
  providers: [DataLoaderService],
})
export class DataLoaderModule {}
