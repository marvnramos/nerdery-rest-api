import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import { SignInResDto } from './dto/response/sign.in.res.dto';
import { Response } from 'express';
import { EnvsConfigService } from '../../utils/config/envs.config.service';
import { SignInReqDto } from './dto/request/sign.in.req.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly envsConfigService: EnvsConfigService,
  ) {}

  async login(req: SignInReqDto, res: Response): Promise<void> {
    const user = await this.usersService.findByEmail(req.email);
    const response: SignInResDto = await this.getAccessToken(user);

    res.cookie('access_token', response.access_token, {
      httpOnly: true,
      secure: this.envsConfigService.getNodeEnv() === 'production',
      maxAge: 60 * 60 * 1000,
      sameSite: 'strict',
    });

    res.json(response);
  }

  async logout(res: Response): Promise<void> {
    res.clearCookie('access_token');
    res.json({ message: 'Logged out successfully' });
  }

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.verifyPassword(user.password, password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async getAccessToken(user: User): Promise<SignInResDto> {
    const userRole = await this.usersService.getUserRole(user.id);
    const payload = {
      sub: user.id,
      role: userRole.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async verifyPassword(
    hashedPassword: string,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
