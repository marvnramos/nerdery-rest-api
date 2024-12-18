import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { StripeController } from './stripe/stripe.controller';
import { StripeModule } from './stripe/stripe.module';
import { GraphqlModule } from './graphql/graphql.module';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailService } from './utils/mailer/mail.service';
import { MailModule } from './utils/mailer/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    StripeModule,
    GraphqlModule,
    UsersModule,
    PrismaModule,
    MailModule,
  ],
  controllers: [AuthController, StripeController, UsersController],
  providers: [PrismaService, MailService],
})
export class AppModule {}
