import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { GraphqlModule } from './graphql.module';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailService } from './mailer/mail.service';
import { MailModule } from './mailer/mail.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CartsModule } from './carts/carts.module';
import { ProductsModule } from './products/products.module';
import { VerificationTokenModule } from './verification.token/verification.token.module';
import { CategoriesModule } from './categories/categories.module';
import { CloudinaryModule } from '../utils/cloudinary/cloudinary.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from '../utils/exception/GlobalExceptionFilter';
import {
  ThrottlerModule,
  seconds,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { ThrottlerBasedOnContextGuard } from '../utils/throttler.context.guard.util';
import { EnvsConfigService } from './config/envs.config.service';
import { EnvsConfigModule } from './config/envs.config.module';

@Module({
  imports: [
    EnvsConfigModule,
    AuthModule,
    PaymentsModule,
    GraphqlModule,
    UsersModule,
    PrismaModule,
    MailModule,
    OrdersModule,
    FavoritesModule,
    CartsModule,
    ProductsModule,
    VerificationTokenModule,
    CategoriesModule,
    CloudinaryModule,
    ThrottlerModule.forRootAsync({
      imports: [EnvsConfigModule],
      useFactory: async (
        envsConfigService: EnvsConfigService,
      ): Promise<ThrottlerModuleOptions> => {
        return [
          {
            ttl: seconds(envsConfigService.getThrottleTTL()),
            limit: envsConfigService.getThrottleLimit(),
          },
        ];
      },
      inject: [EnvsConfigService],
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    PrismaService,
    MailService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerBasedOnContextGuard,
    },
    EnvsConfigService,
  ],
})
export class AppModule {}
