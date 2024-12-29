import { Module } from '@nestjs/common';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../utils/prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { CartsModule } from '../carts/carts.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, UsersModule, CartsModule, ProductsModule],
  providers: [OrdersResolver, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
