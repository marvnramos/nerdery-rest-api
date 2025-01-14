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
import { ForgotPasswordReqDto } from './dto/requests/forgot.password.req.dto';
import { ResetPasswordReqDto } from './dto/requests/reset.password.req.dto';

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

  describe('validateEmail', () => {
    it('should verify the email and mark the token as used when valid input is provided', async () => {
      const mockToken = UserServiceMocks.createToken(UserServiceMocks.uuid, 1);
      verificationTokenService.decodeVerificationToken.mockResolvedValue(
        mockToken.token,
      );
      jest.spyOn(service, 'verifyEmail').mockResolvedValue(true);

      await service.validateEmail(mockToken.token);

      expect(
        verificationTokenService.decodeVerificationToken,
      ).toHaveBeenCalledWith(mockToken.token);
      expect(service.verifyEmail).toHaveBeenCalledWith(mockToken.token);
    });

    it('should throw BadRequestException if the token is invalid or already used', async () => {
      const invalidToken = UserServiceMocks.uuid;
      verificationTokenService.decodeVerificationToken.mockResolvedValue(
        invalidToken,
      );
      jest.spyOn(service, 'verifyEmail').mockResolvedValue(false);

      await expect(service.validateEmail(invalidToken)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should throw BadRequestException if the email is not found', async () => {
      const req = new ForgotPasswordReqDto();
      req.email = UserServiceMocks.email;

      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);

      await expect(service.forgotPassword(req)).rejects.toThrow(
        new BadRequestException('Email not found'),
      );
    });

    it('should send a reset password email if the email exists', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      const req = new ForgotPasswordReqDto();
      req.email = mockUser.email;
      const mockToken = UserServiceMocks.createToken(mockUser.id, 2);
      const encodedToken = encodeBase64(mockToken.token);

      (crypto.randomUUID as jest.Mock).mockReturnValue(mockToken.token);

      (envsConfigService.getBaseUrl as jest.Mock).mockReturnValue(
        'http://localhost:3000',
      );

      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);

      jest
        .spyOn(verificationTokenService, 'encodeVerificationToken')
        .mockResolvedValue(encodedToken);

      jest
        .spyOn(verificationTokenService, 'create')
        .mockResolvedValue(mockToken);

      jest.spyOn(mailService, 'sendEmail').mockResolvedValue(undefined);

      const result = await service.forgotPassword(req);

      expect(service.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(verificationTokenService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          token: mockToken.token,
          user: { connect: { id: mockUser.id } },
          tokenType: { connect: { id: 2 } },
        }),
      );

      expect(result).toEqual({ message: 'Email sent' });
    });

    it('should throw InternalServerErrorException if an error occurs during email sending', async () => {
      const mockUser = UserServiceMocks.createUserMock;
      const req = new ForgotPasswordReqDto();
      req.email = mockUser.email;
      const mockToken = UserServiceMocks.createToken(mockUser.id, 2);
      const encodedToken = encodeBase64(mockToken.token);

      (envsConfigService.getBaseUrl as jest.Mock).mockReturnValue(
        'http://localhost:3000',
      );

      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);

      verificationTokenService.encodeVerificationToken.mockResolvedValue(
        encodedToken,
      );

      verificationTokenService.create.mockResolvedValue(mockToken);

      mailService.sendEmail.mockRejectedValue(
        new Error('Failed to send email'),
      );

      await expect(service.forgotPassword(req)).rejects.toThrow(
        new InternalServerErrorException('Failed to send email'),
      );
    });
  });

  describe('resetPasswordView', () => {
    it('should set a cookie with the token and return the nonce', () => {
      const token = 'test-token';
      const nonce = 'test-nonce';
      const res = {
        locals: { nonce },
        cookie: jest.fn(),
      } as any;

      const result = service.resetPasswordView(token, res);

      expect(res.cookie).toHaveBeenCalledWith('token', token, {
        httpOnly: false,
        maxAge: 900_000,
      });
      expect(result).toEqual({ nonce });
    });

    it('should handle missing nonce in response locals', () => {
      const token = 'test-token';
      const res = {
        locals: {},
        cookie: jest.fn(),
      } as any;

      const result = service.resetPasswordView(token, res);

      expect(res.cookie).toHaveBeenCalledWith('token', token, {
        httpOnly: false,
        maxAge: 900_000,
      });
      expect(result).toEqual({ nonce: undefined });
    });
  });

  describe('resetPassword', () => {
    let req: ResetPasswordReqDto;
    let mockToken: any;
    let mockUser: any;

    beforeEach(() => {
      req = new ResetPasswordReqDto();
      mockToken = UserServiceMocks.createToken(UserServiceMocks.uuid, 2);
      mockUser = UserServiceMocks.createUserMock;
    });

    const setupMocks = () => {
      verificationTokenService.decodeVerificationToken.mockResolvedValue(
        mockToken.token,
      );
      jest
        .spyOn(service, 'hashPassword')
        .mockResolvedValue('hashedPassword123');
      verificationTokenService.findVerificationToken.mockResolvedValue(
        mockToken,
      );
      jest.spyOn(service, 'updatePassword').mockResolvedValue(true);
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      mailService.sendEmail.mockResolvedValue(undefined);
    };

    it('should reset the password and send a confirmation email when valid input is provided', async () => {
      req.token = UserServiceMocks.token;
      req.new_password = UserServiceMocks.password;

      setupMocks();

      await service.resetPassword(req);

      expect(
        verificationTokenService.decodeVerificationToken,
      ).toHaveBeenCalledWith(req.token);
      expect(service.hashPassword).toHaveBeenCalledWith(req.new_password);
      expect(service.updatePassword).toHaveBeenCalledWith(
        mockToken.token,
        'hashedPassword123',
      );
      expect(
        verificationTokenService.findVerificationToken,
      ).toHaveBeenCalledWith(mockToken.token);
      expect(service.findById).toHaveBeenCalledWith(mockToken.user_id);
      expect(mailService.sendEmail).toHaveBeenCalledWith({
        email: mockUser.email,
        fullName: `${mockUser.first_name} ${mockUser.last_name}`,
        subject: 'Password Reset',
        template: './reset-password-confirmation',
      });
    });

    it('should throw BadRequestException if the token is invalid or already used', async () => {
      req.token = 'invalid-token';
      req.new_password = 'newPassword123';

      verificationTokenService.decodeVerificationToken.mockResolvedValue(
        'invalid-token',
      );
      jest.spyOn(service, 'updatePassword').mockResolvedValue(false);
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(service.resetPassword(req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException if an error occurs during email sending', async () => {
      req.token = 'valid-token';
      req.new_password = 'newPassword123';

      setupMocks();
      mailService.sendEmail.mockRejectedValue(
        new Error('Failed to send email'),
      );

      await expect(service.resetPassword(req)).rejects.toThrow(
        InternalServerErrorException,
      );
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
