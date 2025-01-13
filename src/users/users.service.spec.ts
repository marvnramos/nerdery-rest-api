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
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EnvsConfigService } from '../../utils/config/envs.config.service';
import { MailService } from '../mailer/mail.service';

const mockPrisma = {
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
};

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: typeof mockPrisma;
  let verificationTokenService: DeepMocked<VerificationTokenService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: VerificationTokenService,
          useValue: createMock<VerificationTokenService>(),
        },
        {
          provide: MailService,
          useValue: createMock<MailService>(),
        },
        {
          provide: EnvsConfigService,
          useValue: createMock<EnvsConfigService>(),
        },
      ],
    }).compile();

    service = module.get(UsersService);
    prismaService = module.get(PrismaService);
    verificationTokenService = module.get(VerificationTokenService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a user when valid input is provided', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(UserServiceMocks.createUserMock);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: UserServiceMocks.createUserMock,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw an InternalServerErrorException if user creation fails', async () => {
      prismaService.user.create.mockRejectedValueOnce(
        new Error('Failed to create user'),
      );

      await expect(
        service.create(UserServiceMocks.createUserMock),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user when a valid email is provided', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is found', async () => {
      const email = 'nonexistent@example.com';
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail(email);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeNull();
    });

    it('should throw an InternalServerErrorException if finding the user fails', async () => {
      prismaService.user.findUnique.mockRejectedValue(
        new Error('Failed to find user by email'),
      );

      await expect(service.findByEmail('test@example.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const mockHash: string = 'hashedPassword123';
      const password = 'password123';

      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue(mockHash);

      const result = await service.hashPassword(password);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
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
      const mockUser = UserServiceMocks.createUserMock;
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is found', async () => {
      const id = UserServiceMocks.uuid;

      prismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findById(id);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBeNull();
    });

    it('should throw an InternalServerErrorException if finding the user fails', async () => {
      const id = UserServiceMocks.uuid;

      prismaService.user.findUnique.mockRejectedValue(
        new Error('Failed to find user by id'),
      );

      await expect(service.findById(id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserRole', () => {
    it('should return a user role when a valid user ID is provided', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      const mockRole = UserServiceMocks.userManagerRole;

      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      prismaService.userRole.findUnique.mockResolvedValue(mockRole);

      const result = await service.getUserRole(mockUser.id);
      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
      expect(prismaService.userRole.findUnique).toHaveBeenCalledWith({
        where: { id: mockRole.id },
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw an InternalServerErrorException if finding the role fails', async () => {
      const id = UserServiceMocks.uuid;
      jest
        .spyOn(service, 'findById')
        .mockRejectedValue(new Error('Failed to find user by user'));

      await expect(service.getUserRole(id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset the password and mark the token as used when valid input is provided', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      const mockToken = UserServiceMocks.createToken(mockUser.id);

      verificationTokenService.findVerificationToken.mockResolvedValue(
        mockToken,
      );

      prismaService.user.update.mockResolvedValue({});
      prismaService.verificationToken.update.mockResolvedValue({});

      const result = await service.updatePassword(
        mockToken.token,
        'newHashedPassword',
      );

      expect(
        verificationTokenService.findVerificationToken,
      ).toHaveBeenCalledWith(mockToken.token);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { password: 'newHashedPassword' },
      });
      expect(prismaService.verificationToken.update).toHaveBeenCalledWith({
        where: { id: mockToken.id },
        data: { is_used: true },
      });
      expect(result).toBe(true);
    });

    it('should return false if the token is invalid', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      const mockToken = UserServiceMocks.createToken(mockUser.id);
      verificationTokenService.findVerificationToken.mockResolvedValue(null);

      const result = await service.updatePassword(
        mockToken.token,
        'newHashedPassword',
      );
      expect(result).toBe(false);
    });

    it('should throw an InternalServerErrorException if an error occurs', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      const mockToken = UserServiceMocks.createToken(mockUser.id);

      verificationTokenService.findVerificationToken.mockRejectedValue(
        new Error('Failed to reset password'),
      );

      await expect(
        service.updatePassword(mockToken.token, 'newHashedPassword'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify the email and mark the token as used when valid input is provided', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      const mockToken = UserServiceMocks.createToken(mockUser.id, 1);

      verificationTokenService.findVerificationToken.mockResolvedValue(
        mockToken,
      );

      prismaService.user.update.mockResolvedValue({});
      prismaService.verificationToken.update.mockResolvedValue({});

      const result = await service.verifyEmail(mockToken.token);

      expect(
        verificationTokenService.findVerificationToken,
      ).toHaveBeenCalledWith(mockToken.token);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { is_email_verified: true },
      });

      expect(prismaService.verificationToken.update).toHaveBeenCalledWith({
        where: { id: mockToken.id },
        data: { is_used: true },
      });

      expect(result).toBe(true);
    });

    it('should return false if the token is invalid', async () => {
      const invalidToken = UserServiceMocks.uuid;
      verificationTokenService.findVerificationToken.mockResolvedValue(null);

      const result = await service.verifyEmail(invalidToken);
      expect(result).toBe(false);
    });

    it('should throw an InternalServerErrorException if an error occurs', async () => {
      verificationTokenService.findVerificationToken.mockRejectedValue(
        new Error('Failed to verify email'),
      );

      await expect(service.verifyEmail('validToken')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return a user when a valid ID is provided', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw a NotFoundException when no user is found', async () => {
      const nonexistentId = UserServiceMocks.uuid;
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserById(nonexistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
