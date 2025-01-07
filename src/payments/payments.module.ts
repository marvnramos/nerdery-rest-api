import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../utils/prisma/prisma.module';
import { OrdersModule } from 'src/orders/orders.module';
import { MailModule } from '../utils/mailer/mail.module';
import { EnvsConfigModule } from '../config/envs.config.module';

@Module({
  imports: [EnvsConfigModule, PrismaModule, OrdersModule, MailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
