import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../../utils/prisma/prisma.module';
import { MailModule } from '../mailer/mail.module';
import { VerificationTokenModule } from '../verification.token/verification.token.module';

@Module({
  imports: [PrismaModule, MailModule, VerificationTokenModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
