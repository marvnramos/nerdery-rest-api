import { Module } from '@nestjs/common';
import { FavoritesResolver } from './favorites.resolver';
import { FavoritesService } from './favorites.service';
import { PrismaModule } from '../utils/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FavoritesResolver, FavoritesService],
  exports: [FavoritesResolver, FavoritesService],
})
export class FavoritesModule {}
