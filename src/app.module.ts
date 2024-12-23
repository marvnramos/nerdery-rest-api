import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { GraphqlModule } from './graphql.module';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { PrismaService } from './utils/prisma/prisma.service';
import { PrismaModule } from './utils/prisma/prisma.module';
import { MailService } from './utils/mailer/mail.service';
import { MailModule } from './utils/mailer/mail.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CartsModule } from './carts/carts.module';
import { ProductsModule } from './products/products.module';
import { VerificationTokenModule } from './verification.token/verification.token.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AuthController, UsersController],
  providers: [PrismaService, MailService],
})
export class AppModule {}
