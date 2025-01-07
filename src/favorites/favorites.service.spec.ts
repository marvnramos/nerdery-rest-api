import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../utils/prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { plainToInstance } from 'class-transformer';
import { FavoriteServiceMocks } from '../../test/mocks/favorite.mocks';
import { AddFavoriteRes } from './dto/responses/add.favorite.res';
import { ProductType } from '../products/types/product.type';
import { ProductServiceMocks } from '../../test/mocks/product.mocks';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prismaService: PrismaService;
  let productService: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: {
            favorite: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: ProductsService,
          useValue: {
            validateProductExists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    prismaService = module.get<PrismaService>(PrismaService);
    productService = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkOrUncheckAsFavorite', () => {
    it('should add a favorite if it does not exist', async () => {
      const userId = 'user123';
      const productId = 'product123';

      jest
        .spyOn(productService, 'validateProductExists')
        .mockResolvedValue(ProductServiceMocks.product);
      jest.spyOn(prismaService.favorite, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.favorite, 'create')
        .mockResolvedValue(FavoriteServiceMocks.newFavorite(userId, productId));

      const result = await service.checkOrUncheckAsFavorite(userId, productId);

      expect(productService.validateProductExists).toHaveBeenCalledWith(
        productId,
      );
      expect(prismaService.favorite.findUnique).toHaveBeenCalledWith({
        where: {
          user_id_product_id: {
            user_id: userId,
            product_id: productId,
          },
        },
      });
      expect(prismaService.favorite.create).toHaveBeenCalledWith({
        data: {
          user: { connect: { id: userId } },
          product: { connect: { id: productId } },
        },
      });
      expect(result).toEqual(
        plainToInstance(
          AddFavoriteRes,
          FavoriteServiceMocks.newFavorite(userId, productId),
        ),
      );
    });

    it('should remove a favorite if it already exists', async () => {
      const userId = 'user123';
      const productId = 'product123';

      jest
        .spyOn(productService, 'validateProductExists')
        .mockResolvedValue(ProductServiceMocks.product);
      jest
        .spyOn(prismaService.favorite, 'findUnique')
        .mockResolvedValue(FavoriteServiceMocks.existingFavorite);
      jest.spyOn(prismaService.favorite, 'delete').mockResolvedValue(undefined);

      const result = await service.checkOrUncheckAsFavorite(userId, productId);

      expect(productService.validateProductExists).toHaveBeenCalledWith(
        productId,
      );
      expect(prismaService.favorite.findUnique).toHaveBeenCalledWith({
        where: {
          user_id_product_id: {
            user_id: userId,
            product_id: productId,
          },
        },
      });
      expect(prismaService.favorite.delete).toHaveBeenCalledWith({
        where: { id: FavoriteServiceMocks.existingFavorite.id },
      });

      expect(result).toEqual(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('getFavoritesOwns', () => {
    it('should return the user’s favorite products', async () => {
      const userId = 'user123';

      jest
        .spyOn(prismaService.favorite, 'findMany')
        .mockResolvedValue(FavoriteServiceMocks.userFavorites);

      const result = await service.getFavoritesOwns(userId);

      expect(prismaService.favorite.findMany).toHaveBeenCalledWith({
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

      expect(result).toEqual(
        FavoriteServiceMocks.userFavorites.map((favorite) => ({
          ...favorite,
          product: plainToInstance(ProductType, favorite.product),
        })),
      );
    });

    it('should return an empty array if no favorites are found', async () => {
      const userId = 'user123';
      jest.spyOn(prismaService.favorite, 'findMany').mockResolvedValue([]);

      const result = await service.getFavoritesOwns(userId);

      expect(prismaService.favorite.findMany).toHaveBeenCalledWith({
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

      expect(result).toEqual([]);
    });
  });
});
