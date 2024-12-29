import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../utils/prisma/prisma.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [ConfigModule, PrismaModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
