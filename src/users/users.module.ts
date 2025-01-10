import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mailer/mail.module';
import { VerificationTokenModule } from '../verification.token/verification.token.module';
import { EnvsConfigModule } from '../../utils/config/envs.config.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    VerificationTokenModule,
    EnvsConfigModule,
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
