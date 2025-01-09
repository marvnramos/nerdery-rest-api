import { PrismaService } from '../../utils/prisma/prisma.service';
import { VerificationTokenService } from './verification.token.service';
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { VerificationToken } from '@prisma/client';

describe('VerificationTokenService', () => {
  let verificationTokenService: VerificationTokenService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationTokenService,
        {
          provide: PrismaService,
          useValue: {
            verificationToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    verificationTokenService = module.get<VerificationTokenService>(
      VerificationTokenService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a verification token successfully', async () => {
      const data = {
        token: 'test-token',
        is_used: false,
        expired_at: new Date(),
        user: { connect: { id: 'user-id' } },
        tokenType: { connect: { id: 1 } },
      };
      const createdToken: VerificationToken = {
        id: '1',
        token: data.token,
        is_used: data.is_used,
        expired_at: data.expired_at,
        created_at: new Date(),
        updated_at: new Date(),
        user_id: 'user-id',
        token_type_id: 1,
      };

      jest
        .spyOn(prismaService.verificationToken, 'create')
        .mockResolvedValue(createdToken);

      const result = await verificationTokenService.create(data);
      expect(result).toEqual(createdToken);
      expect(prismaService.verificationToken.create).toHaveBeenCalledWith({
        data,
      });
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const data = {
        token: 'test-token',
        is_used: false,
        expired_at: new Date(),
        user: { connect: { id: 'user-id' } },
        tokenType: { connect: { id: 1 } },
      };

      jest
        .spyOn(prismaService.verificationToken, 'create')
        .mockRejectedValue(new Error('Failed to create verification token'));

      await expect(verificationTokenService.create(data)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('encodeVerificationToken', () => {
    it('should encode the verification token correctly', async () => {
      const token = 'test-token';
      const encodedToken = Buffer.from(token).toString('base64');

      const result =
        await verificationTokenService.encodeVerificationToken(token);

      expect(result).toBe(encodedToken);
    });
  });

  describe('decodeVerificationToken', () => {
    it('should decode the encoded token correctly', async () => {
      const token = 'test-token';
      const encodedToken = Buffer.from(token).toString('base64');

      const result =
        await verificationTokenService.decodeVerificationToken(encodedToken);

      expect(result).toBe(token);
    });
  });

  describe('findVerificationToken', () => {
    it('should find a verification token successfully', async () => {
      const token = 'test-token';
      const foundToken = {
        id: '1',
        token,
        is_used: false,
        expired_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        user_id: 'user-id',
        token_type_id: 1,
      } as VerificationToken;

      jest
        .spyOn(prismaService.verificationToken, 'findUnique')
        .mockResolvedValue(foundToken);

      const result =
        await verificationTokenService.findVerificationToken(token);
      expect(result).toEqual(foundToken);
      expect(prismaService.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token },
      });
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const token = 'test-token';

      jest
        .spyOn(prismaService.verificationToken, 'findUnique')
        .mockRejectedValue(new Error('Failed to find verification token'));

      await expect(
        verificationTokenService.findVerificationToken(token),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
