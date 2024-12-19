import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../utils/prisma/prisma.module';
import { MailModule } from '../utils/mailer/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
