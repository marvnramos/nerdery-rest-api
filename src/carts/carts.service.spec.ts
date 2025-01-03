import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { PrismaService } from '../utils/prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { NotAcceptableException } from '@nestjs/common';
import { ProductServiceMocks } from '../../test/mocks/product.mocks';
import { CartServiceMocks } from '../../test/mocks/cart.mocks';

describe('CartsService', () => {
  let service: CartsService;
  let prismaService: PrismaService;
  let productService: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        {
          provide: PrismaService,
          useValue: {
            cart: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            cartItem: {
              upsert: jest.fn(),
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

    service = module.get<CartsService>(CartsService);
    prismaService = module.get<PrismaService>(PrismaService);
    productService = module.get<ProductsService>(ProductsService);
  });

  describe('addProductToCart', () => {
    it('should add a product to the cart if sufficient stock is available', async () => {
      const userId = 'c087cc65-32e2-405b-9c11-ccf413843724';
      const mockArgs = {
        productId: 'ff7aade2-3920-48ce-b419-8385b324f25c',
        quantity: 1,
        cartId: '49c84175-021f-4603-a1b4-836f1f287dea',
      };

      jest
        .spyOn(productService, 'findProductById')
        .mockResolvedValue(ProductServiceMocks.product);
      jest
        .spyOn(service, 'getOrCreateCart')
        .mockResolvedValue(CartServiceMocks.cart);
      jest
        .spyOn(service, 'upsertCartItem')
        .mockResolvedValue(CartServiceMocks.cartItem);

      const result = await service.addProductToCart(userId, mockArgs);

      expect(productService.findProductById).toHaveBeenCalledWith(
        mockArgs.productId,
      );
      expect(service.getOrCreateCart).toHaveBeenCalledWith(
        userId,
        mockArgs.cartId,
      );
      expect(service.upsertCartItem).toHaveBeenCalledWith(
        mockArgs.cartId,
        mockArgs.productId,
        mockArgs.quantity,
      );

      expect(result).toEqual(
        expect.objectContaining(CartServiceMocks.updatedCartItem),
      );
    });

    it('should throw NotAcceptableException if product stock is insufficient', async () => {
      const userId = 'user123';
      const mockArgs = { productId: 'prod123', quantity: 2 };

      jest
        .spyOn(productService, 'findProductById')
        .mockResolvedValue(ProductServiceMocks.productWithLowStock);
      jest
        .spyOn(service, 'getOrCreateCart')
        .mockResolvedValue(CartServiceMocks.cart);

      await expect(service.addProductToCart(userId, mockArgs)).rejects.toThrow(
        NotAcceptableException,
      );

      expect(productService.findProductById).toHaveBeenCalledWith('prod123');
      expect(service.getOrCreateCart).not.toHaveBeenCalled();
    });

    it('should create a new cart if none exists for the user', async () => {
      const mockArgs = { productId: 'prod123', quantity: 2, cartId: undefined };

      jest
        .spyOn(productService, 'findProductById')
        .mockResolvedValue(ProductServiceMocks.product);
      jest
        .spyOn(service, 'getOrCreateCart')
        .mockResolvedValue(CartServiceMocks.cart);
      jest
        .spyOn(service, 'upsertCartItem')
        .mockResolvedValue(CartServiceMocks.cartItem);

      const result = await service.addProductToCart('user123', mockArgs);
      console.log(result)
      expect(service.getOrCreateCart).toHaveBeenCalledWith('user123');
      expect(result).toEqual(
        expect.objectContaining(CartServiceMocks.updatedCartItem),
      );
    });
  });
});
