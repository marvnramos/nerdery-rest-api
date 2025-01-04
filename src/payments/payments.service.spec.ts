import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../utils/prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { MailService } from '../utils/mailer/mail.service';
import { PaymentsService } from './payments.service';
import {
  NotAcceptableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserRoleType } from '@prisma/client';
import Stripe from 'stripe';
import { Request, Response } from 'express';
import { CartsService } from '../carts/carts.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { MailerService } from '@nestjs-modules/mailer';
import { VerificationTokenService } from '../verification.token/verification.token.service';

const mockStripeInstance = {
  paymentIntents: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockStripeInstance),
  };
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let ordersService: OrdersService;
  let stripe: jest.Mocked<Stripe>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        PrismaService,
        OrdersService,
        CartsService,
        UsersService,
        ProductsService,
        MailService,
        VerificationTokenService,
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn() },
        },
        {
          provide: Stripe,
          useValue: mockStripeInstance,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    ordersService = module.get<OrdersService>(OrdersService);

    stripe = new Stripe('test_key', {
      apiVersion: '2024-11-20.acacia',
    }) as jest.Mocked<Stripe>;
  });

  describe('PaymentsService', () => {
    describe('createPaymentIntent', () => {
      it('should create a payment intent successfully given a valid order and user', async () => {
        const mockOrder = {
          orderDetails: [
            { product_id: 'prod_123', quantity: 2, unit_price: 1000 },
            { product_id: 'prod_456', quantity: 1, unit_price: 500 },
          ],
        };

        jest
          .spyOn(ordersService, 'getOrderById')
          .mockResolvedValue(mockOrder as any);
        jest
          .spyOn(prismaService.paymentDetail, 'findFirst')
          .mockResolvedValue(null);
        jest.spyOn(stripe.paymentIntents, 'create').mockResolvedValue({
          id: 'pi_123',
          client_secret: 'secret_123',
          payment_method_types: ['card'],
        } as any);
        jest
          .spyOn(prismaService.paymentDetail, 'create')
          .mockResolvedValue(null);

        jest
          .spyOn(prismaService.product, 'update')
          .mockImplementation(({ where }) => {
            if (where.id === 'prod_123') {
              return {
                id: 'prod_123',
                stock: 10,
                product_name: 'Product 123',
                description: '',
                is_available: true,
                unit_price: 1000,
                created_at: new Date(),
                updated_at: new Date(),
                cartItems: [],
                orderDetails: [],
                favorites: [],
                categories: [],
                images: [],
              } as any;
            }
            if (where.id === 'prod_456') {
              return {
                id: 'prod_456',
                stock: 5,
                product_name: 'Product 456',
                description: '',
                is_available: true,
                unit_price: 500,
                created_at: new Date(),
                updated_at: new Date(),
                cartItems: [],
                orderDetails: [],
                favorites: [],
                categories: [],
                images: [],
              } as any;
            }
            throw new Error('Record to update not found');
          });

        const result = await service.createPaymentIntent('order123', {
          id: 'user123',
          role: 'USER' as UserRoleType,
        });

        expect(result).toEqual({ clientSecret: 'secret_123' });
        expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
          amount: 2500,
          currency: 'usd',
          metadata: { orderId: 'order123' },
        });
      });

      it('should throw NotAcceptableException if the order has already been paid', async () => {
        jest
          .spyOn(prismaService.paymentDetail, 'findFirst')
          .mockResolvedValue({} as any);

        await expect(
          service.createPaymentIntent('order123', {
            id: 'user123',
            role: 'USER' as UserRoleType,
          }),
        ).rejects.toThrow(NotAcceptableException);
      });
    });

    describe('handleStripeWebhook', () => {
      it('should process the Stripe webhook successfully for valid events', async () => {
        const mockRequest = {
          headers: { 'stripe-signature': 'sig_123' },
          body: {},
        } as unknown as Request;
        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn(),
        } as any as Response;
        const mockEvent = { type: 'payment_intent.succeeded' };

        jest
          .spyOn(stripe.webhooks, 'constructEvent')
          .mockReturnValue(mockEvent as any);
        jest.spyOn(service as any, 'processEvent').mockResolvedValue(null);

        await service.handleStripeWebhook(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.send).toHaveBeenCalledWith({ received: true });
      });

      it('should throw HttpException with BAD_REQUEST when the webhook verification fails', async () => {
        const mockRequest = {
          headers: { 'stripe-signature': 'invalid_sig' },
          body: {},
        } as unknown as Request;
        const mockResponse = {} as Response;

        jest.spyOn(stripe.webhooks, 'constructEvent').mockImplementation(() => {
          throw new Error('Invalid signature');
        });

        await expect(
          service.handleStripeWebhook(mockRequest, mockResponse),
        ).rejects.toThrow(
          new HttpException(
            'Webhook verification failed',
            HttpStatus.BAD_REQUEST,
          ),
        );
      });
    });
  });
});
