import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthServiceMocks } from '../../test/mocks/auth.mocks';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EnvsConfigService } from '../../utils/config/envs.config.service';
import { encodeBase64 } from '../../utils/encoder.util';
import { Response } from 'express';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: DeepMocked<UsersService>;
  let jwtService: DeepMocked<JwtService>;
  const { user, userRole, access_token } = AuthServiceMocks;
  const hashedPassword = encodeBase64(user.password);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: createMock<UsersService>() },
        { provide: JwtService, useValue: createMock<JwtService>() },
        {
          provide: EnvsConfigService,
          useValue: createMock<EnvsConfigService>(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('verifyCredentials', () => {
    it('should return null if user is not found', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      const result = await service.verifyCredentials(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValueOnce(user);
      jest.spyOn(service, 'verifyPassword').mockResolvedValueOnce(false);

      const result = await service.verifyCredentials(
        user.email,
        'wrongPassword',
      );

      expect(result).toBeNull();
    });

    it('should return the user if credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValueOnce(user);
      jest.spyOn(service, 'verifyPassword').mockResolvedValueOnce(true);

      const result = await service.verifyCredentials(user.email, user.password);

      expect(result).toEqual(user);
    });
  });

  describe('getAccessToken', () => {
    it('should return an access token', async () => {
      usersService.getUserRole.mockResolvedValueOnce(userRole);
      jwtService.sign.mockReturnValueOnce(access_token);

      const result = await service.getAccessToken(user);

      expect(result).toEqual({ access_token });
    });
  });

  describe('verifyPassword', () => {
    it('should return true if password is valid', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (): Promise<boolean> => true);

      const result = await service.verifyPassword(
        hashedPassword,
        user.password,
      );

      expect(result).toBe(true);
    });

    it('should return false if password is invalid', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (): Promise<boolean> => false);

      const result = await service.verifyPassword(
        hashedPassword,
        'wrongPassword',
      );

      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    let res: Response;

    beforeEach(() => {
      res = {
        cookie: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;
    });

    it('should set a cookie and return a response with access token', async () => {
      usersService.findByEmail.mockResolvedValueOnce(user);
      jest
        .spyOn(service, 'getAccessToken')
        .mockResolvedValueOnce({ access_token });

      await service.login({ email: user.email, password: user.password }, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        access_token,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          maxAge: 60 * 60 * 1000,
          sameSite: 'strict',
        }),
      );
      expect(res.json).toHaveBeenCalledWith({ access_token });
      expect(service.getAccessToken).toHaveBeenCalledWith(user);
    });

    it('should throw an error if user is not found', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.login(
          { email: 'nonexistent@example.com', password: 'password' },
          res,
        ),
      ).rejects.toThrow('Invalid credentials');

      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear the access_token cookie and return a success message', async () => {
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await service.logout(res);

      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      });
    });
  });
});
