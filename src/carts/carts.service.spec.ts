import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { NotAcceptableException, NotFoundException } from '@nestjs/common';
import { ProductServiceMocks } from '../../test/mocks/product.mocks';
import { CartServiceMocks } from '../../test/mocks/cart.mocks';
import { RemoveProductFromCartArgs } from './dto/args/remove.product.from.cart.args';
import { plainToInstance } from 'class-transformer';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker/locale/ar';
import { UpdateProductCartRes } from './dto/response/update.product.cart.res';

const mockPrisma = {
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
};

describe('CartsService', () => {
  let service: CartsService;
  let prismaService: typeof mockPrisma;
  let productService: DeepMocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProductsService,
          useValue: createMock<ProductsService>(),
        },
      ],
    }).compile();

    service = module.get(CartsService);
    prismaService = module.get(PrismaService);
    productService = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addProductToCart', () => {
    it('should add a product to the cart if sufficient stock is available', async () => {
      const userId = faker.string.uuid();
      const cart = CartServiceMocks.createCart(userId);
      const mockArgs = {
        productId: faker.string.uuid(),
        quantity: 1,
        cartId: cart.id,
      };
      const cartItem = CartServiceMocks.createCartItem(
        cart.id,
        mockArgs.productId,
        mockArgs.quantity,
      );

      productService.findProductById.mockResolvedValue(
        ProductServiceMocks.product,
      );

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(cart);

      jest.spyOn(service, 'upsertCartItem').mockResolvedValue(cartItem);

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

      expect(result).toEqual(plainToInstance(UpdateProductCartRes, cartItem));
    });

    it('should throw NotAcceptableException if product stock is insufficient', async () => {
      const userId = faker.string.uuid();
      const mockArgs = {
        productId: faker.string.uuid(),
        quantity: 2,
      };

      const productWithLowStock = ProductServiceMocks.createProduct(1);

      productService.findProductById.mockResolvedValue(productWithLowStock);

      jest
        .spyOn(service, 'getOrCreateCart')
        .mockResolvedValue(CartServiceMocks.cart);

      await expect(service.addProductToCart(userId, mockArgs)).rejects.toThrow(
        NotAcceptableException,
      );

      expect(productService.findProductById).toHaveBeenCalledWith(
        mockArgs.productId,
      );
      expect(service.getOrCreateCart).not.toHaveBeenCalled();
    });

    it('should create a new cart if none exists for the user', async () => {
      const mockArgs = {
        productId: faker.string.uuid(),
        quantity: 2,
      };
      const authUserId = faker.string.uuid();

      const userId = faker.string.uuid();
      const product = ProductServiceMocks.createProduct();
      const cart = CartServiceMocks.createCart(userId);
      const cartItem = CartServiceMocks.createCartItem(cart.id, product.id, 9);

      productService.findProductById.mockResolvedValue(product);

      productService.findProductById.mockResolvedValue(product);

      jest.spyOn(service, 'getOrCreateCart').mockResolvedValue(cart);
      jest.spyOn(service, 'upsertCartItem').mockResolvedValue(cartItem);

      const result = await service.addProductToCart(authUserId, mockArgs);
      expect(service.getOrCreateCart).toHaveBeenCalledWith(
        authUserId,
        undefined,
      );

      expect(result).toEqual(
        expect.objectContaining(
          plainToInstance(UpdateProductCartRes, cartItem),
        ),
      );
    });
  });

  describe('deleteProductFromCart', () => {
    let mockUserId: string;
    let mockArgs: RemoveProductFromCartArgs;
    let product: ReturnType<typeof ProductServiceMocks.createProduct>;
    let cart: ReturnType<typeof CartServiceMocks.createCart>;

    beforeEach(() => {
      mockUserId = faker.string.uuid();
      mockArgs = {
        productId: faker.string.uuid(),
        cartId: faker.string.uuid(),
      };
      product = ProductServiceMocks.createProduct();
      cart = CartServiceMocks.createCart(mockUserId);
    });

    it('should delete a product from the cart', async () => {
      productService.findProductById.mockResolvedValue(product);
      jest.spyOn(service, 'findCartById').mockResolvedValue(cart);
      jest.spyOn(service, 'validateCartOwnership').mockImplementation();

      const cartItem = CartServiceMocks.createCartItem(cart.id, product.id, 3);
      prismaService.cartItem.delete.mockResolvedValue(cartItem);

      const result = await service.deleteProductFromCart(mockUserId, mockArgs);

      expect(result).toEqual(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if the product is not found in the cart', async () => {
      productService.findProductById.mockResolvedValue(product);
      jest.spyOn(service, 'findCartById').mockResolvedValue(cart);
      jest.spyOn(service, 'validateCartOwnership').mockImplementation();

      prismaService.cartItem.delete.mockRejectedValue(
        new NotFoundException('Record not found'),
      );

      await expect(
        service.deleteProductFromCart(mockUserId, mockArgs),
      ).rejects.toThrow(NotFoundException);

      expect(productService.findProductById).toHaveBeenCalledWith(
        mockArgs.productId,
      );
      expect(service.findCartById).toHaveBeenCalledWith(mockArgs.cartId);
      expect(service.validateCartOwnership).toHaveBeenCalledWith(
        cart,
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
      const otherUserCart = CartServiceMocks.createCart(faker.string.uuid());
      productService.findProductById.mockResolvedValue(product);
      jest.spyOn(service, 'findCartById').mockResolvedValue(otherUserCart);

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
    const userId = faker.string.uuid();

    it('should return the cart for the user', async () => {
      const mockCart = CartServiceMocks.cartToGetCartByUserId(userId);
      prismaService.cart.findUnique.mockResolvedValue(mockCart);

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
      prismaService.cart.findUnique.mockResolvedValue(null);

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
    const cartId = faker.string.uuid();

    it('should return the cart items for the cart', async () => {
      const mockCart = CartServiceMocks.cart;
      const mockCartItems = CartServiceMocks.cartItemToGetCartById;

      jest.spyOn(service, 'findCartById').mockResolvedValue(mockCart);
      prismaService.cartItem.findMany.mockResolvedValue(mockCartItems);

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
    const userId = faker.string.uuid();
    it('should  a new cart item when it does not exist', async () => {
      const productId = faker.string.uuid();
      const cart = CartServiceMocks.createCart(userId);
      const cartItem = CartServiceMocks.createCartItem(cart.id, productId, 3);

      prismaService.cartItem.upsert.mockResolvedValue(cartItem);

      const result = await service.upsertCartItem(
        cart.id,
        productId,
        cartItem.quantity,
      );

      expect(prismaService.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cart_id_product_id: { cart_id: cart.id, product_id: productId },
        },
        update: { quantity: cartItem.quantity },
        create: {
          cart_id: cart.id,
          product_id: productId,
          quantity: cartItem.quantity,
        },
      });

      expect(result).toEqual(cartItem);
    });
    it('should update the quantity of an existing cart item', async () => {
      const product = ProductServiceMocks.createProduct();
      const cart = CartServiceMocks.createCart(userId);
      const cartItem = CartServiceMocks.createCartItem(cart.id, product.id, 3);

      prismaService.cartItem.upsert.mockResolvedValue(cartItem);

      const result = await service.upsertCartItem(
        cart.id,
        product.id,
        cartItem.quantity,
      );

      expect(prismaService.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cart_id_product_id: { cart_id: cart.id, product_id: product.id },
        },
        update: { quantity: cartItem.quantity },
        create: {
          cart_id: cart.id,
          product_id: product.id,
          quantity: cartItem.quantity,
        },
      });

      expect(result).toEqual(cartItem);
    });
  });
  describe('clearCartItems', () => {
    it('should delete all cart items for the given cart ID', async () => {
      const cartId = faker.string.uuid();
      const deletionResult = { count: 3 };
      prismaService.cartItem.deleteMany.mockResolvedValue(deletionResult);

      const result = await service.clearCartItems(cartId);

      expect(prismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: cartId },
      });
      expect(result).toEqual(deletionResult);
    });
  });
});
