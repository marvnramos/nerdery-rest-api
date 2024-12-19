import { Module } from '@nestjs/common';
import { FavoritesResolver } from './favorites.resolver';
import { FavoritesService } from './favorites.service';

@Module({
  providers: [FavoritesResolver, FavoritesService]
})
export class FavoritesModule {}
