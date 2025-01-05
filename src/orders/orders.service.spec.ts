import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../utils/prisma/prisma.service';
import { CartsService } from '../carts/carts.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { UserRoleType } from '@prisma/client';
import { AddOrderArgs } from './dto/args/add.order.args';
import { GetOrdersArgs } from './dto/args/get.orders.args';
import { AddOrderRes } from './dto/responses/add.order.res';
import { PaginatedOrdersType } from './dto/responses/orders.pagination.type.res';
import { OrderType } from './types/order.type';
import {
  ForbiddenException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let cartsService: CartsService;
  let usersService: UsersService;
  let productsService: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            orderDetail: { createMany: jest.fn() },
          },
        },
        {
          provide: CartsService,
          useValue: {
            findCartById: jest.fn(), // Mocked function using jest.fn()
            getCartItems: jest.fn(), // Mocked function using jest.fn()
            clearCartItems: jest.fn(), // Mocked function using jest.fn()
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn(), // Mocked function using jest.fn()
          },
        },
        {
          provide: ProductsService,
          useValue: {
            getProductUnitPrice: jest.fn(), // Mocked function using jest.fn()
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    cartsService = module.get<CartsService>(CartsService);
    usersService = module.get<UsersService>(UsersService);
    productsService = module.get<ProductsService>(ProductsService);
  });

  describe('addOrder', () => {
    it('should create an order successfully and return AddOrderRes', async () => {
      (cartsService.findCartById as jest.Mock).mockResolvedValue({
        user_id: 'user123',
      });

      (cartsService.getCartItems as jest.Mock).mockResolvedValue([
        { product_id: 'prod123', quantity: 2 },
      ]);

      (usersService.getUserById as jest.Mock).mockResolvedValue({
        id: 'user123',
        address: 'test address',
      });

      (prismaService.order.create as jest.Mock).mockResolvedValue({
        id: 'order123',
        created_at: new Date(),
      });

      (prismaService.orderDetail.createMany as jest.Mock).mockResolvedValue(
        null,
      );

      const args: AddOrderArgs = {
        cartId: 'cart123',
        address: 'address123',
        nearbyLandmark: 'landmark123',
      };
      const result = await service.addOrder('user123', args);

      expect(result).toBeInstanceOf(AddOrderRes);
      expect(result.id).toBe('order123');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(prismaService.order.create).toHaveBeenCalled();
      expect(prismaService.orderDetail.createMany).toHaveBeenCalled();
      expect(cartsService.clearCartItems).toHaveBeenCalledWith('cart123');
    });

    it('should throw NotAcceptableException if the cart does not belong to the user', async () => {
      (cartsService.findCartById as jest.Mock).mockResolvedValue({
        user_id: 'differentUser',
      });

      const args: AddOrderArgs = {
        cartId: 'cart123',
        address: 'address123',
        nearbyLandmark: 'landmark123',
      };

      await expect(service.addOrder('user123', args)).rejects.toThrow(
        NotAcceptableException,
      );
    });

    it('should throw NotAcceptableException if the cart has no items', async () => {
      (cartsService.findCartById as jest.Mock).mockResolvedValue({
        user_id: 'user123',
      });
      (cartsService.getCartItems as jest.Mock).mockResolvedValue([]);

      const args: AddOrderArgs = {
        cartId: 'cart123',
        address: 'address123',
        nearbyLandmark: 'landmark123',
      };

      await expect(service.addOrder('user123', args)).rejects.toThrow(
        NotAcceptableException,
      );
    });
  });

  describe('getOrderById', () => {
    it('should return an order as OrderType for valid user access', async () => {
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order123',
        user_id: 'user123',
        address: 'test address',
        nearby_landmark: 'landmark',
        created_at: new Date(),
        updated_at: new Date(),
        orderDetails: [],
        paymentDetail: null,
      });

      const result = await service.getOrderById('order123', {
        id: 'user123',
        role: UserRoleType.CLIENT,
      });

      expect(result).toBeInstanceOf(OrderType);
      expect(result.id).toBe('order123');
      expect(result.user_id).toBe('user123');
    });

    it('should throw NotAcceptableException if a client tries to access another user’s order', async () => {
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order123',
        user_id: 'differentUser',
      });

      await expect(
        service.getOrderById('order123', {
          id: 'user123',
          role: UserRoleType.CLIENT,
        }),
      ).rejects.toThrow(NotAcceptableException);
    });

    it('should throw NotFoundException if the order is not found', async () => {
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getOrderById('nonexistentOrderId', {
          id: 'user123',
          role: UserRoleType.CLIENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaginatedOrders', () => {
    it('should return PaginatedOrdersType for a manager', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'order123',
          user_id: 'user123',
          address: 'address',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      (prismaService.order.count as jest.Mock).mockResolvedValue(1);

      const args: GetOrdersArgs = { first: 10 };
      const result = await service.getPaginatedOrders(args, {
        id: 'admin123',
        role: UserRoleType.MANAGER,
      });

      expect(result).toBeInstanceOf(PaginatedOrdersType);
      expect(result.totalCount).toBe(1);
      expect(result.edges).toHaveLength(1);
    });

    it('should throw ForbiddenException if a client tries to filter by email', async () => {
      const args: GetOrdersArgs = { first: 10, userEmail: 'test@example.com' };

      await expect(
        service.getPaginatedOrders(args, {
          id: 'user123',
          role: UserRoleType.CLIENT,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return PaginatedOrdersType for a client filtering their own orders', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'order123',
          user_id: 'user123',
          address: 'address',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      (prismaService.order.count as jest.Mock).mockResolvedValue(1);

      const args: GetOrdersArgs = { first: 10 };
      const result = await service.getPaginatedOrders(args, {
        id: 'user123',
        role: UserRoleType.CLIENT,
      });

      expect(result).toBeInstanceOf(PaginatedOrdersType);
      expect(result.totalCount).toBe(1);
      expect(result.edges).toHaveLength(1);
    });

    it('should throw NotFoundException if no orders are found', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.order.count as jest.Mock).mockResolvedValue(0);

      const args: GetOrdersArgs = { first: 10 };

      await expect(
        service.getPaginatedOrders(args, {
          id: 'user123',
          role: UserRoleType.CLIENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
