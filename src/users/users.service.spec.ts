import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationTokenService } from '../verification.token/verification.token.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserServiceMocks } from '../../test/mocks/user.mocks';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EnvsConfigService } from '../../utils/config/envs.config.service';
import { MailService } from '../mailer/mail.service';
import { SignupReqDto } from './dto/requests/signup.req.dto';
import { encodeBase64 } from '../../utils/encoder.util';
import * as crypto from 'crypto';

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

jest.mock('crypto', () => {
  const actualCrypto = jest.requireActual('crypto');
  return {
    ...actualCrypto,
    randomUUID: jest.fn(),
  };
});

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: typeof mockPrisma;
  let verificationTokenService: DeepMocked<VerificationTokenService>;
  let mailService: DeepMocked<MailService>;
  let envsConfigService: DeepMocked<EnvsConfigService>;

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
    mailService = module.get(MailService);
    envsConfigService = module.get(EnvsConfigService);

    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should throw BadRequestException if the email already exists', async () => {
      const message = 'Email already exists';
      const req = new SignupReqDto();

      jest
        .spyOn(service, 'findByEmail')
        .mockRejectedValueOnce(new BadRequestException(message));

      req.email = UserServiceMocks.email;
      await expect(service.signUp(req)).rejects.toThrow(
        new BadRequestException(message),
      );
    });

    it('should create a user and send an email verification', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      const mockToken = UserServiceMocks.createToken(mockUser.id, 1);
      const req = new SignupReqDto();
      req.first_name = mockUser.first_name;
      req.last_name = mockUser.last_name;
      req.email = mockUser.email;
      req.password = mockUser.password;
      req.address = mockUser.address;
      const encodedToken = encodeBase64(mockToken.token);

      (crypto.randomUUID as jest.Mock).mockReturnValue(mockToken.token);

      (envsConfigService.getBaseUrl as jest.Mock).mockReturnValue(
        'http://localhost:3000',
      );

      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(null);
      jest.spyOn(service, 'hashPassword').mockResolvedValue('hashed-password');
      jest.spyOn(service, 'create').mockResolvedValueOnce({
        ...req,
        id: mockUser.id,
        is_email_verified: false,
        role_id: mockUser.role_id,
        created_at: mockToken.created_at,
        updated_at: mockUser.updated_at,
      });
      jest
        .spyOn(verificationTokenService, 'create')
        .mockResolvedValueOnce(mockToken);
      jest
        .spyOn(verificationTokenService, 'encodeVerificationToken')
        .mockResolvedValueOnce(encodedToken);
      jest.spyOn(mailService, 'sendEmail').mockResolvedValueOnce(undefined);

      const result = await service.signUp(req);

      expect(service.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(service.hashPassword).toHaveBeenCalledWith(mockUser.password);
      expect(service.create).toHaveBeenCalledWith({
        ...req,
        is_email_verified: false,
      });
      expect(verificationTokenService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_used: false,
          user: { connect: { id: mockUser.id } },
          tokenType: { connect: { id: 1 } },
        }),
      );
      expect(
        verificationTokenService.encodeVerificationToken,
      ).toHaveBeenCalledWith(mockToken.token);

      expect(result).toEqual({
        created_at: expect.any(Date),
      });
    });

    it('should throw validation errors if required fields are missing', async () => {
      const req = new SignupReqDto();
      await expect(service.signUp(req)).rejects.toThrow();
    });
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
