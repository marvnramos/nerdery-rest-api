import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationTokenService } from '../verification.token/verification.token.service';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserServiceMocks } from '../../test/mocks/user.mocks';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let verificationTokenService: VerificationTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            userRole: {
              findUnique: jest.fn(),
            },
            verificationToken: {
              update: jest.fn(),
            },
          },
        },
        {
          provide: VerificationTokenService,
          useValue: {
            findVerificationToken: jest.fn(),
            encodeVerificationToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    verificationTokenService = module.get<VerificationTokenService>(
      VerificationTokenService,
    );

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a user when valid input is provided', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' } as any;
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);

      const result = await service.create(UserServiceMocks.user);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: UserServiceMocks.userCreate,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw an InternalServerErrorException if user creation fails', async () => {
      jest
        .spyOn(prismaService.user, 'create')
        .mockRejectedValue(new Error('Failed to create user'));

      await expect(service.create(UserServiceMocks.userFail)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user when a valid email is provided', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' } as any;
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });

    it('should throw an InternalServerErrorException if finding the user fails', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue(new Error('Failed to find user by email'));

      await expect(service.findByEmail('test@example.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const mockHash: string = 'hashedPassword123';
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue(mockHash);

      const result = await service.hashPassword('password123');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toEqual(mockHash);
    });

    it('should throw an InternalServerErrorException if hashing fails', async () => {
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockRejectedValue(
        new Error('Failed to hash password'),
      );

      await expect(service.hashPassword('password123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findById', () => {
    it('should return a user when a valid ID is provided', async () => {
      const mockUser = UserServiceMocks.userFindByEmail as any;
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findById('user123');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findById('nonexistentId');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistentId' },
      });
      expect(result).toBeNull();
    });

    it('should throw an InternalServerErrorException if finding the user fails', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue(new Error('Failed to find user by id'));

      await expect(service.findById('user123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserRole', () => {
    it('should return a user role when a valid user ID is provided', async () => {
      const mockUser = { id: 'user123', role_id: 1 } as any;
      const mockRole = { id: 1, role: 'MANAGER' } as any;

      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.userRole, 'findUnique')
        .mockResolvedValue(mockRole);

      const result = await service.getUserRole('user123');
      expect(service.findById).toHaveBeenCalledWith('user123');
      expect(prismaService.userRole.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw an InternalServerErrorException if finding the role fails', async () => {
      jest
        .spyOn(service, 'findById')
        .mockRejectedValue(new Error('Failed to find user by user'));

      await expect(service.getUserRole('user123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset the password and mark the token as used when valid input is provided', async () => {
      const mockToken = {
        id: 'token123',
        token: 'validToken',
        user_id: 'user123',
        token_type_id: 2,
        is_used: false,
        expired_at: new Date(Date.now() + 1000 * 60 * 60),
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest
        .spyOn(verificationTokenService, 'findVerificationToken')
        .mockResolvedValue(mockToken);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest
        .spyOn(prismaService.verificationToken, 'update')
        .mockResolvedValue({} as any);

      const result = await service.resetPassword(
        'validToken',
        'newHashedPassword',
      );
      expect(
        verificationTokenService.findVerificationToken,
      ).toHaveBeenCalledWith('validToken');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: { password: 'newHashedPassword' },
      });
      expect(prismaService.verificationToken.update).toHaveBeenCalledWith({
        where: { id: 'token123' },
        data: { is_used: true },
      });
      expect(result).toBe(true);
    });

    it('should return false if the token is invalid', async () => {
      jest
        .spyOn(verificationTokenService, 'findVerificationToken')
        .mockResolvedValue(null);

      const result = await service.resetPassword(
        'invalidToken',
        'newHashedPassword',
      );
      expect(result).toBe(false);
    });

    it('should throw an InternalServerErrorException if an error occurs', async () => {
      jest
        .spyOn(verificationTokenService, 'findVerificationToken')
        .mockRejectedValue(new Error('Failed to reset password'));

      await expect(
        service.resetPassword('validToken', 'newHashedPassword'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify the email and mark the token as used when valid input is provided', async () => {
      const mockToken = {
        id: 'token123',
        token: 'validToken',
        user_id: 'user123',
        token_type_id: 1,
        is_used: false,
        expired_at: new Date(Date.now() + 1000 * 60 * 60),
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest
        .spyOn(verificationTokenService, 'findVerificationToken')
        .mockResolvedValue(mockToken);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest
        .spyOn(prismaService.verificationToken, 'update')
        .mockResolvedValue({} as any);

      const result = await service.verifyEmail('validToken');
      expect(
        verificationTokenService.findVerificationToken,
      ).toHaveBeenCalledWith('validToken');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: { is_email_verified: true },
      });
      expect(prismaService.verificationToken.update).toHaveBeenCalledWith({
        where: { id: 'token123' },
        data: { is_used: true },
      });
      expect(result).toBe(true);
    });

    it('should return false if the token is invalid', async () => {
      jest
        .spyOn(verificationTokenService, 'findVerificationToken')
        .mockResolvedValue(null);

      const result = await service.verifyEmail('invalidToken');
      expect(result).toBe(false);
    });

    it('should throw an InternalServerErrorException if an error occurs', async () => {
      jest
        .spyOn(verificationTokenService, 'findVerificationToken')
        .mockRejectedValue(new Error('Failed to verify email'));

      await expect(service.verifyEmail('validToken')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return a user when a valid ID is provided', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' } as any;
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getUserById('user123');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw a NotFoundException when no user is found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserById('nonexistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
