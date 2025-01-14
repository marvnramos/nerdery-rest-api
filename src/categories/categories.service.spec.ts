import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CategoryServiceMocks } from '../../test/mocks/category.mocks';
import { AddCategoryRes } from './dto/responses/create.category.res';
import { faker } from '@faker-js/faker/locale/ar';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  productCategory: {
    findMany: jest.fn(),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProductsService,
          useValue: {
            findProductById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CategoriesService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const category = CategoryServiceMocks.createMockCategory();

      prismaService.category.findUnique.mockResolvedValue(null);
      prismaService.category.create.mockResolvedValue(category);

      const result = await service.createCategory(category.category_name);

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { category_name: category.category_name },
      });

      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: { category_name: category.category_name },
      });

      expect(result).toEqual(plainToInstance(AddCategoryRes, category));
    });

    it('should throw BadRequestException if category already exists', async () => {
      const category = CategoryServiceMocks.createMockCategory();

      prismaService.category.findUnique.mockResolvedValue(category);

      await expect(
        service.createCategory(category.category_name),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { category_name: category.category_name },
      });
    });
  });

  describe('removeCategory', () => {
    const category = CategoryServiceMocks.createMockCategory();
    it('should delete a category if not in use', async () => {
      prismaService.category.findUnique.mockResolvedValue(category);
      prismaService.productCategory.findMany.mockResolvedValue([]);
      prismaService.category.delete.mockResolvedValue(undefined);

      const result = await service.removeCategory(category.id);

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: category.id },
      });

      expect(prismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: { category_id: category.id },
      });

      expect(prismaService.category.delete).toHaveBeenCalledWith({
        where: { id: category.id },
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
      prismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.removeCategory(categoryId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
    });

    it('should throw NotAcceptableException if category is in use', async () => {
      prismaService.category.findUnique.mockRejectedValue(category);
      prismaService.productCategory.findMany.mockResolvedValue([
        {
          category_id: 1,
          product_id: faker.string.uuid(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      await expect(service.removeCategory(1)).rejects.toThrow(
        new NotAcceptableException(),
      );

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: category.id },
      });
      expect(prismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: { category_id: category.id },
      });
    });
  });

  // describe('getAllCategories', () => {
  //   it('should return all categories', async () => {
  //     jest
  //       .spyOn(prismaService.category, 'findMany')
  //       .mockResolvedValue(CategoryServiceMocks.allCategories);
  //
  //     const result = await service.getAllCategories();
  //
  //     expect(prismaService.category.findMany).toHaveBeenCalled();
  //     expect(result).toEqual(CategoryServiceMocks.allCategories);
  //   });
  //
  //   it('should throw NotFoundException if no categories are found', async () => {
  //     jest.spyOn(prismaService.category, 'findMany').mockResolvedValue([]);
  //
  //     await expect(service.getAllCategories()).rejects.toThrow(
  //       NotFoundException,
  //     );
  //
  //     expect(prismaService.category.findMany).toHaveBeenCalled();
  //   });
  // });
});
