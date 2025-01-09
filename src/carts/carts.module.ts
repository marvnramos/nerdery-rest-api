import { Module } from '@nestjs/common';
import { CartsResolver } from './carts.resolver';
import { CartsService } from './carts.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [CartsResolver, CartsService],
  exports: [CartsService],
})
export class CartsModule {}
