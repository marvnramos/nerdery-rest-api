import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseFilters } from '@nestjs/common';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { FavoritesService } from './favorites.service';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { FavoriteType } from './types/favorite.type';
import { CheckUncheckFavoriteArgs } from './dto/args/check.uncheck.favorite.args';
import { FavoriteResponse } from './dto/responses/favorite.res';

@Resolver(() => FavoriteType)
@UseFilters(new GlobalExceptionFilter())
export class FavoritesResolver {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Auth('CLIENT')
  @Mutation(() => FavoriteResponse)
  async checkOrUncheckAsFavorite(
    @Args('data') data: CheckUncheckFavoriteArgs,
    @Context('request') { user }: { user: { id: string } },
  ): Promise<typeof FavoriteResponse> {
    return this.favoritesService.checkOrUncheckAsFavorite(
      user.id,
      data.productId,
    );
  }

  // @Auth('CLIENT')
  // @Mutation(() => [FavoriteType])
  // async getFavorites(
  //   @Context('request') req: any,
  // ): Promise<FavoriteType[]> {}
}
