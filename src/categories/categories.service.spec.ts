import { CategoriesService } from './categories.service';
import { PrismaService } from '../utils/prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CategoryServiceMocks } from '../../test/mocks/category.mocks';
import { Categories } from './models/categories.model';
import { AddCategoryRes } from './dto/responses/create.category.res';
import { DeleteCategoryRes } from './dto/responses/delete.category.res';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            productCategory: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findProductById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const categoryName = 'Electronics';

      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.category, 'create')
        .mockResolvedValue(
          plainToInstance(Categories, CategoryServiceMocks.createCategoryRes),
        );

      const result = await service.createCategory(categoryName);

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { category_name: categoryName },
      });

      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: { category_name: categoryName },
      });

      expect(result).toEqual(
        expect.objectContaining(
          plainToInstance(
            AddCategoryRes,
            CategoryServiceMocks.createCategoryRes,
          ),
        ),
      );
    });

    it('should throw BadRequestException if category already exists', async () => {
      const categoryName = 'Electronics';
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(
          plainToInstance(Categories, CategoryServiceMocks.category),
        );

      await expect(service.createCategory(categoryName)).rejects.toThrow(
        BadRequestException,
      );

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { category_name: categoryName },
      });
    });
  });

  describe('removeCategory', () => {
    it('should delete a category if not in use', async () => {
      const categoryId = 1;

      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(
          plainToInstance(Categories, CategoryServiceMocks.category),
        );

      jest
        .spyOn(prismaService.productCategory, 'findMany')
        .mockResolvedValue([]);

      jest.spyOn(prismaService.category, 'delete').mockResolvedValue(undefined);

      const result = await service.removeCategory(categoryId);

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });

      expect(prismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: { category_id: categoryId },
      });

      expect(prismaService.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      });

      expect(result).toMatchObject(
        expect.objectContaining({
          ...CategoryServiceMocks.deletedCategory,
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const categoryId = 1;
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

      await expect(service.removeCategory(categoryId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
    });

    it('should throw NotAcceptableException if category is in use', async () => {
      const categoryId = 1;
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(
          plainToInstance(Categories, CategoryServiceMocks.category),
        );
      jest.spyOn(prismaService.productCategory, 'findMany').mockResolvedValue([
        {
          category_id: 1,
          product_id: 'some-id',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      await expect(service.removeCategory(categoryId)).rejects.toThrow(
        NotAcceptableException,
      );

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue(
          CategoryServiceMocks.allCategories.map((category) =>
            plainToInstance(Categories, category),
          ),
        );

      const result = await service.getAllCategories();

      expect(prismaService.category.findMany).toHaveBeenCalled();
      expect(result).toEqual(
        CategoryServiceMocks.allCategories.map((category) =>
          plainToInstance(Categories, category),
        ),
      );
    });

    it('should throw NotFoundException if no categories are found', async () => {
      jest.spyOn(prismaService.category, 'findMany').mockResolvedValue([]);

      await expect(service.getAllCategories()).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.category.findMany).toHaveBeenCalled();
    });
  });
});
