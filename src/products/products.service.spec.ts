import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../utils/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OperationType } from '../utils/enums/operation.enum';
import { AddProductRes } from './dto/responses/create.product.res';
import { UpdateProductRes } from './dto/responses/update.product.images.res';
import { RemoveProductRes } from './dto/responses/remove.product.res';
import { UpdateProductImagesArgs } from './dto/args/update.product.images.args';
import { ProductType } from './types/product.type';
import { EnvsConfigService } from '../config/envs.config.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockEnvsConfigService = {
      getCloudinaryCloudName: jest.fn().mockReturnValue('mock-cloud-name'),
      getCloudinaryApiKey: jest.fn().mockReturnValue('mock-api-key'),
      getCloudinaryApiSecret: jest.fn().mockReturnValue('mock-api-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: EnvsConfigService,
          useValue: mockEnvsConfigService,
        },
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
            productImages: {
              create: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
            productCategory: {
              createMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createProduct', () => {
    it('should create a product successfully and return AddProductRes', async () => {
      (prismaService.product.create as jest.Mock).mockResolvedValue({
        id: 'product123',
        created_at: new Date(),
      });

      const args = {
        productName: 'Test Product',
        description: 'Test Description',
        stock: 10,
        isAvailable: true,
        unitPrice: 100,
        categories: [1, 2],
      };

      const result = await service.createProduct(args);

      expect(result).toBeInstanceOf(AddProductRes);
      expect(result.id).toBe('product123');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(prismaService.product.create).toHaveBeenCalled();
    });
  });

  describe('editProductData', () => {
    it('should update product data and return UpdateProductRes', async () => {
      (prismaService.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product123',
      });

      (prismaService.product.update as jest.Mock).mockResolvedValue({
        id: 'product123',
        updated_at: new Date(),
      });

      const args = {
        productName: 'Updated Product',
        stock: 20,
      };

      const result = await service.editProductData('product123', args);

      expect(result).toBeInstanceOf(UpdateProductRes);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(prismaService.product.update).toHaveBeenCalled();
    });
  });

  describe('removeProduct', () => {
    it('should delete a product and return RemoveProductRes', async () => {
      (prismaService.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product123',
      });
      (prismaService.product.delete as jest.Mock).mockResolvedValue({
        id: 'product123',
      });
      (prismaService.productImages.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.removeProduct('product123');

      expect(result).toBeInstanceOf(RemoveProductRes);
      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(prismaService.product.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if the product does not exist', async () => {
      jest
        .spyOn(service, 'validateProductExists')
        .mockRejectedValue(
          new NotFoundException('Product with ID invalidId not found'),
        );

      await expect(service.removeProduct('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProductImages', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update product images successfully when adding images', async () => {
      jest
        .spyOn(service, 'validateProductExists')
        .mockResolvedValue({ id: 'product123' } as any);
      jest.spyOn(service, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://mock-cloudinary-url/image.jpg',
        public_id: 'mock_public_id',
      });
      jest.spyOn(service, 'addProductImage').mockResolvedValue({} as any);

      const uploadedImages = [
        { buffer: Buffer.from('image') },
      ] as Express.Multer.File[];
      const updateImagesDto: UpdateProductImagesArgs = {
        op: OperationType.ADD,
      };

      await service.updateProductImages(
        'product123',
        uploadedImages,
        updateImagesDto,
      );

      expect(service.validateProductExists).toHaveBeenCalledWith('product123');
      expect(service.uploadToCloudinary).toHaveBeenCalledTimes(1);
      expect(service.addProductImage).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException if no images are provided for "add" operation', async () => {
      const uploadedImages: Express.Multer.File[] = [];
      const updateImagesDto: UpdateProductImagesArgs = {
        op: OperationType.ADD,
      };

      await expect(
        service.updateProductImages(
          'product123',
          uploadedImages,
          updateImagesDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no public image IDs are provided for "remove" operation', async () => {
      const updateImagesDto: UpdateProductImagesArgs = {
        op: OperationType.REMOVE,
        publicImageId: [],
      };

      await expect(
        service.updateProductImages('product123', [], updateImagesDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should remove product images successfully when removing images', async () => {
      jest
        .spyOn(service, 'validateProductExists')
        .mockResolvedValue({ id: 'product123' } as any);
      jest
        .spyOn(service, 'removeProductImages')
        .mockResolvedValue({ result: 'ok' });

      const updateImagesDto: UpdateProductImagesArgs = {
        op: OperationType.REMOVE,
        publicImageId: ['mock_public_id_1', 'mock_public_id_2'],
      };

      await service.updateProductImages('product123', [], updateImagesDto);

      expect(service.validateProductExists).toHaveBeenCalledWith('product123');
      expect(service.removeProductImages).toHaveBeenCalledTimes(2);
    });
  });

  describe('getProductUnitPrice', () => {
    it('should return the correct unit price of the product', async () => {
      (prismaService.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product123',
        unit_price: 100,
      });

      const result = await service.getProductUnitPrice('product123');

      expect(result).toBe(100);
    });

    it('should throw NotFoundException if the product does not exist', async () => {
      (prismaService.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProductUnitPrice('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProductCategories', () => {
    it('should add categories when operation is ADD', async () => {
      jest
        .spyOn(service, 'validateProductExists')
        .mockResolvedValue({ id: 'product123' } as any);
      jest
        .spyOn(prismaService.productCategory, 'createMany')
        .mockResolvedValue({ count: 2 } as any);

      const data = {
        id: 'product123',
        op: OperationType.ADD,
        categories: [1, 2],
      };

      await service.updateProductCategories(data);

      expect(service.validateProductExists).toHaveBeenCalledWith('product123');
      expect(prismaService.productCategory.createMany).toHaveBeenCalledWith({
        data: [
          { product_id: 'product123', category_id: 1 },
          { product_id: 'product123', category_id: 2 },
        ],
        skipDuplicates: true,
      });
    });

    it('should remove categories when operation is REMOVE', async () => {
      jest
        .spyOn(service, 'validateProductExists')
        .mockResolvedValue({ id: 'product123' } as any);
      jest
        .spyOn(prismaService.productCategory, 'deleteMany')
        .mockResolvedValue({ count: 2 } as any);

      const data = {
        id: 'product123',
        op: OperationType.REMOVE,
        categories: [1, 2],
      };

      await service.updateProductCategories(data);

      expect(service.validateProductExists).toHaveBeenCalledWith('product123');
      expect(prismaService.productCategory.deleteMany).toHaveBeenCalledWith({
        where: { product_id: 'product123', category_id: { in: [1, 2] } },
      });
    });

    it('should throw BadRequestException when no categories are provided', async () => {
      jest
        .spyOn(service, 'validateProductExists')
        .mockResolvedValue({ id: 'product123' } as any);

      const data = {
        id: 'product123',
        op: OperationType.ADD,
        categories: [],
      };

      await expect(service.updateProductCategories(data)).rejects.toThrow(
        BadRequestException,
      );

      expect(service.validateProductExists).toHaveBeenCalledWith('product123');
      expect(prismaService.productCategory.createMany).not.toHaveBeenCalled();
      expect(prismaService.productCategory.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('getProductById', () => {
    it('should return a product when it exists', async () => {
      jest.spyOn(service, 'findProductById').mockResolvedValue({
        id: 'product123',
        product_name: 'Test Product',
        unit_price: 100,
      } as any);

      const result = await service.getProductById('product123');

      expect(service.findProductById).toHaveBeenCalledWith('product123');
      expect(result).toEqual(expect.any(ProductType));
    });

    it('should throw NotFoundException when the product does not exist', async () => {
      jest
        .spyOn(service, 'findProductById')
        .mockRejectedValue(new NotFoundException());

      await expect(service.getProductById('product123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPaginatedProducts', () => {
    it('should return paginated products when valid arguments are provided', async () => {
      jest.spyOn(service, 'fetchPaginatedProducts').mockResolvedValue({
        edges: [{ node: { id: 'product123' }, cursor: 'cursor123' }],
        pageInfo: { endCursor: 'cursor123', hasNextPage: true },
        totalCount: 1,
      } as any);

      const args = {
        first: 10,
        after: 'cursor123',
        categoriesIds: [1, 2],
      };

      const result = await service.getPaginatedProducts(args);

      expect(service.fetchPaginatedProducts).toHaveBeenCalledWith(args);
      expect(result).toEqual({
        edges: expect.any(Array),
        pageInfo: expect.any(Object),
        totalCount: expect.any(Number),
      });
    });

    it('should correctly filter products by category IDs', async () => {
      jest.spyOn(service, 'fetchPaginatedProducts').mockResolvedValue({
        edges: [{ node: { id: 'product123' }, cursor: 'cursor123' }],
        pageInfo: { endCursor: 'cursor123', hasNextPage: true },
        totalCount: 1,
      } as any);

      const args = {
        first: 10,
        categoriesIds: [1],
      };

      await service.getPaginatedProducts(args);

      expect(service.fetchPaginatedProducts).toHaveBeenCalledWith(args);
    });

    it('should correctly paginate when after cursor is provided', async () => {
      jest.spyOn(service, 'fetchPaginatedProducts').mockResolvedValue({
        edges: [{ node: { id: 'product123' }, cursor: 'cursor123' }],
        pageInfo: { endCursor: 'cursor123', hasNextPage: true },
        totalCount: 1,
      } as any);

      const args = {
        first: 5,
        after: 'cursor123',
      };

      await service.getPaginatedProducts(args);

      expect(service.fetchPaginatedProducts).toHaveBeenCalledWith(args);
    });
  });
});
