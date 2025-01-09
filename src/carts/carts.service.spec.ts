import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { NotAcceptableException, NotFoundException } from '@nestjs/common';
import { ProductServiceMocks } from '../../test/mocks/product.mocks';
import { CartServiceMocks } from '../../test/mocks/cart.mocks';
import { RemoveProductFromCartArgs } from './dto/args/remove.product.from.cart.args';
import { RemoveProductFromCartRes } from './dto/response/remove.product.from.cart.res';
import { plainToInstance } from 'class-transformer';

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
              delete: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
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

  afterEach(() => {
    jest.clearAllMocks();
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
      const mockArgs = { productId: 'prod123', quantity: 2 };

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
      expect(service.getOrCreateCart).toHaveBeenCalledWith(
        'user123',
        undefined,
      );

      expect(result).toEqual(
        expect.objectContaining(CartServiceMocks.updatedCartItem),
      );
    });
  });

  describe('deleteProductFromCart', () => {
    const mockUserId = 'user123';
    const mockArgs: RemoveProductFromCartArgs = {
      productId: 'ff7aade2-3920-48ce-b419-8385b324f25c',
      cartId: '49c84175-021f-4603-a1b4-836f1f287dea',
    };

    it('should delete a product from the cart', async () => {
      jest
        .spyOn(productService, 'findProductById')
        .mockResolvedValue(ProductServiceMocks.product);

      jest
        .spyOn(service, 'findCartById')
        .mockResolvedValue(CartServiceMocks.cartFromDeleteProductFromCart);

      jest.spyOn(service, 'validateCartOwnership').mockImplementation();

      jest
        .spyOn(prismaService.cartItem, 'delete')
        .mockResolvedValue(CartServiceMocks.cartItemToDelete);

      const result = plainToInstance(RemoveProductFromCartRes, {
        deleted_at: new Date(),
      });
      expect(result).toBeInstanceOf(RemoveProductFromCartRes);
      expect(result.deletedAt).toBeDefined();
      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(result).toEqual(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if the product is not found in the cart', async () => {
      jest
        .spyOn(productService, 'findProductById')
        .mockResolvedValue(ProductServiceMocks.productToDeleteProductFromCart);

      jest.spyOn(service, 'findCartById').mockResolvedValue({
        id: 'cart123',
        user_id: mockUserId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      jest.spyOn(service, 'validateCartOwnership').mockImplementation();

      jest
        .spyOn(prismaService.cartItem, 'delete')
        .mockRejectedValue(new Error('Record not found'));

      await expect(
        service.deleteProductFromCart(mockUserId, mockArgs),
      ).rejects.toThrow(NotFoundException);

      expect(productService.findProductById).toHaveBeenCalledWith(
        mockArgs.productId,
      );
      expect(service.findCartById).toHaveBeenCalledWith(mockArgs.cartId);
      expect(service.validateCartOwnership).toHaveBeenCalledWith(
        {
          id: 'cart123',
          user_id: mockUserId,
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
        mockUserId,
      );
      expect(prismaService.cartItem.delete).toHaveBeenCalledWith({
        where: {
          cart_id_product_id: {
            cart_id: mockArgs.cartId,
            product_id: mockArgs.productId,
          },
        },
      });
    });

    it('should throw NotAcceptableException if the cart does not belong to the user', async () => {
      jest
        .spyOn(productService, 'findProductById')
        .mockResolvedValue(ProductServiceMocks.productToDeleteProductFromCart);

      jest
        .spyOn(service, 'findCartById')
        .mockResolvedValue(CartServiceMocks.notAcceptableExceptionCart);

      await expect(
        service.deleteProductFromCart(mockUserId, mockArgs),
      ).rejects.toThrow(NotAcceptableException);

      expect(productService.findProductById).toHaveBeenCalledWith(
        mockArgs.productId,
      );
      expect(service.findCartById).toHaveBeenCalledWith(mockArgs.cartId);
    });
  });

  describe('getCartByUserId', () => {
    const userId = 'user123';

    it('should return the cart for the user', async () => {
      const mockCart = CartServiceMocks.cartToGetCartByUserId(userId);

      jest.spyOn(prismaService.cart, 'findUnique').mockResolvedValue(mockCart);

      const result = await service.getCartByUserId(userId);

      expect(prismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { user_id: userId },
        include: service['getCartIncludeRelations'](),
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: mockCart.id,
          cart_items: expect.arrayContaining(
            mockCart.cart_items.map((item) =>
              expect.objectContaining({
                id: item.id,
                product: expect.objectContaining({
                  id: item.product.id,
                  product_name: item.product.product_name,
                }),
              }),
            ),
          ),
        }),
      );
    });

    it('should throw NotFoundException if the cart is not found', async () => {
      jest.spyOn(prismaService.cart, 'findUnique').mockResolvedValue(null);

      await expect(service.getCartByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { user_id: userId },
        include: service['getCartIncludeRelations'](),
      });
    });
  });

  describe('getCartItemsByCartId', () => {
    const cartId = '49c84175-021f-4603-a1b4-836f1f287dea';

    it('should return the cart items for the cart', async () => {
      const mockCart = CartServiceMocks.cart;
      const mockCartItems = CartServiceMocks.cartItemToGetCartById;

      jest.spyOn(service, 'findCartById').mockResolvedValue(mockCart);
      jest
        .spyOn(prismaService.cartItem, 'findMany')
        .mockResolvedValue(mockCartItems);

      const result = await service.getCartItemsByCartId(cartId);

      expect(service.findCartById).toHaveBeenCalledWith(cartId);
      expect(prismaService.cartItem.findMany).toHaveBeenCalledWith({
        where: { cart_id: cartId },
        include: service['getCartItemIncludeRelations'](),
      });

      expect(result).toEqual(
        expect.arrayContaining(
          mockCartItems.map((item) =>
            expect.objectContaining({
              id: item.id,
              quantity: item.quantity,
              product: expect.objectContaining({
                id: item.product.id,
                productName: item.product.product_name,
              }),
            }),
          ),
        ),
      );
    });

    it('should throw NotFoundException if the cart does not exist', async () => {
      jest
        .spyOn(service, 'findCartById')
        .mockRejectedValue(new NotFoundException());

      await expect(service.getCartItemsByCartId(cartId)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.findCartById).toHaveBeenCalledWith(cartId);
      expect(prismaService.cartItem.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getOrCreateCart', () => {
    const userId = CartServiceMocks.cart.user_id;
    const mockCart = CartServiceMocks.cart;
    it('should return an existing cart if it exists', async () => {
      jest.spyOn(prismaService.cart, 'findUnique').mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(userId);

      expect(prismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { user_id: userId },
      });

      expect(result).toEqual(mockCart);
    });

    it('should return a new cart when none exists', async () => {
      jest.spyOn(prismaService.cart, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.cart, 'create')
        .mockResolvedValue(CartServiceMocks.cart);

      const result = await service.getOrCreateCart(userId);

      expect(prismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { user_id: userId },
      });

      expect(prismaService.cart.create).toHaveBeenCalledWith({
        data: {
          user: { connect: { id: userId } },
        },
      });

      expect(result).toEqual(CartServiceMocks.cart);
    });

    it('should throw NotAcceptableException if the cart does not belong to the user', async () => {
      const userId = 'notUserOwnerId';

      jest.spyOn(prismaService.cart, 'findUnique').mockResolvedValue(mockCart);

      jest.spyOn(service, 'validateCartOwnership').mockImplementation(() => {
        throw new NotAcceptableException();
      });

      await expect(
        service.getOrCreateCart(userId, mockCart.id),
      ).rejects.toThrow(NotAcceptableException);

      expect(service.validateCartOwnership).toHaveBeenCalledWith(
        mockCart,
        userId,
      );
    });
  });
  describe('upsertCartItem', () => {
    it('should  a new cart item when it does not exist', async () => {
      const cartId = 'cart456';
      const productId = 'product456';
      const quantity = 3;

      const newCartItem = CartServiceMocks.newUpsertCartItem(
        cartId,
        productId,
        quantity,
      );

      jest
        .spyOn(prismaService.cartItem, 'upsert')
        .mockResolvedValue(newCartItem);

      const result = await service.upsertCartItem(cartId, productId, quantity);

      expect(prismaService.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cart_id_product_id: { cart_id: cartId, product_id: productId },
        },
        update: { quantity },
        create: {
          cart_id: cartId,
          product_id: productId,
          quantity,
        },
      });

      expect(result).toEqual(newCartItem);
    });
    it('should update the quantity of an existing cart item', async () => {
      const cartId = CartServiceMocks.cart.id;
      const productId = CartServiceMocks.cartItem.product_id;
      const quantity = 3;
      const updatedCartItem = CartServiceMocks.newUpsertCartItem(
        cartId,
        productId,
        quantity,
      );

      jest
        .spyOn(prismaService.cartItem, 'upsert')
        .mockResolvedValue(updatedCartItem);

      const result = await service.upsertCartItem(cartId, productId, quantity);

      expect(prismaService.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cart_id_product_id: { cart_id: cartId, product_id: productId },
        },
        update: { quantity },
        create: {
          cart_id: cartId,
          product_id: productId,
          quantity,
        },
      });

      expect(result).toEqual(updatedCartItem);
    });
  });
  describe('clearCartItems', () => {
    it('should delete all cart items for the given cart ID', async () => {
      const cartId = 'testCart123';
      const mockDeleteResult = { count: 3 };

      jest
        .spyOn(prismaService.cartItem, 'deleteMany')
        .mockResolvedValue(mockDeleteResult);

      const result = await service.clearCartItems(cartId);

      expect(prismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: cartId },
      });
      expect(result).toEqual(mockDeleteResult);
    });
  });
});
