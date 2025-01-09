import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from 'src/orders/orders.module';
import { MailModule } from '../mailer/mail.module';
import { EnvsConfigModule } from '../config/envs.config.module';

@Module({
  imports: [EnvsConfigModule, PrismaModule, OrdersModule, MailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
