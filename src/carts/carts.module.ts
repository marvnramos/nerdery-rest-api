import { Module } from '@nestjs/common';
import { CartsResolver } from './carts.resolver';
import { CartsService } from './carts.service';
import { PrismaModule } from 'src/utils/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CartsResolver, CartsService],
  exports: [CartsService],
})
export class CartsModule {}
