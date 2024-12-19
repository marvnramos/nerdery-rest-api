import { Module } from '@nestjs/common';
import { CartsResolver } from './carts.resolver';
import { CartsService } from './carts.service';

@Module({
  providers: [CartsResolver, CartsService]
})
export class CartsModule {}
