import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  accessTokenMock,
  userMock,
  userRoleMock,
} from '../../test/mocks/auth.mocks';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            getUserRole: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('verifyCredentials', () => {
    it('should return null if user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await authService.verifyCredentials(
        'test@example.com',
        'password123',
      );
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(userMock);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (): Promise<boolean> => false);

      const result = await authService.verifyCredentials(
        'test@example.com',
        'wrongPassword',
      );
      expect(result).toBeNull();
    });

    it('should return the user if credentials are valid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(userMock);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (): Promise<boolean> => true);

      const result = await authService.verifyCredentials(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(userMock);
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      jest.spyOn(usersService, 'getUserRole').mockResolvedValue(userRoleMock);
      jest.spyOn(jwtService, 'sign').mockReturnValue(accessTokenMock);

      const result = await authService.login(userMock);
      expect(result).toEqual({ accessToken: accessTokenMock });
    });
  });

  describe('verifyPassword', () => {
    it('should return true if password is valid', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (): Promise<boolean> => true);

      const result = await authService.verifyPassword(
        'hashedPassword',
        'password123',
      );
      expect(result).toBe(true);
    });

    it('should return false if password is invalid', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async (): Promise<boolean> => false);

      const result = await authService.verifyPassword(
        'hashedPassword',
        'wrongPassword',
      );
      expect(result).toBe(false);
    });
  });
});
