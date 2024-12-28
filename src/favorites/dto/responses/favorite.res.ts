import { createUnionType } from '@nestjs/graphql';
import { AddFavoriteRes } from './add.favorite.res';
import { RemoveFavoriteRes } from './remove.favorite.res';

export const FavoriteResponse = createUnionType({
  name: 'FavoriteResponse',
  types: () => [AddFavoriteRes, RemoveFavoriteRes] as const,
  resolveType(value) {
    if ('deletedAt' in value) {
      return RemoveFavoriteRes;
    }
    return AddFavoriteRes;
  },
});
