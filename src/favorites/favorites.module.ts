import { Module } from '@nestjs/common';
import { FavoritesResolver } from './favorites.resolver';
import { FavoritesService } from './favorites.service';
import { PrismaModule } from '../../utils/prisma/prisma.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [FavoritesResolver, FavoritesService],
  exports: [FavoritesResolver, FavoritesService],
})
export class FavoritesModule {}
