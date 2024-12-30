import { Injectable } from '@nestjs/common';
import { PrismaService } from '../utils/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { AddFavoriteRes } from './dto/responses/add.favorite.res';
import { Favorite } from '@prisma/client';
import { RemoveFavoriteRes } from './dto/responses/remove.favorite.res';
import { FavoriteType } from './types/favorite.type';
import { ProductType } from '../products/types/product.type';

@Injectable()
export class FavoritesService {
  constructor(private readonly prismaService: PrismaService) {}

  async checkOrUncheckAsFavorite(
    userId: string,
    productId: string,
  ): Promise<AddFavoriteRes | RemoveFavoriteRes> {
    const existingFavorite = await this.prismaService.favorite.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
    });

    if (existingFavorite) {
      await this.removeFavorite(existingFavorite.id);
      return this.createRemoveFavoriteResponse();
    }

    const newFavorite = await this.addFavorite(userId, productId);
    return plainToInstance(AddFavoriteRes, newFavorite);
  }

  async getFavoritesOwns(userId: string): Promise<FavoriteType[]> {
    const favorites = await this.prismaService.favorite.findMany({
      where: { user_id: userId },
      include: {
        product: {
          include: {
            categories: true,
            images: true,
          },
        },
      },
    });

    const favoriteTypes = favorites.map((favorite) => {
      const product = favorite.product;
      const productType = plainToInstance(ProductType, product);
      return {
        ...favorite,
        product: productType,
      };
    });

    return favoriteTypes;
  }

  private async removeFavorite(favoriteId: string): Promise<void> {
    await this.prismaService.favorite.delete({
      where: { id: favoriteId },
    });
  }

  private createRemoveFavoriteResponse(): RemoveFavoriteRes {
    const response = new RemoveFavoriteRes();
    response.deletedAt = new Date();
    return response;
  }

  private async addFavorite(
    userId: string,
    productId: string,
  ): Promise<Favorite> {
    return this.prismaService.favorite.create({
      data: {
        user: { connect: { id: userId } },
        product: { connect: { id: productId } },
      },
    });
  }
}
