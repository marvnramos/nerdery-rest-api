import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, VerificationToken } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { getCurrentTimestamp } from '../utils/timestamp';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.prismaService.user.create({ data });
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prismaService.user.findFirst({ where: { email } });
    } catch (error) {
      console.error(`Error finding user with email ${email}:`, error);
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  async encodeVerificationToken(token: string): Promise<string> {
    return Buffer.from(token).toString('base64');
  }

  async decodeVerificationToken(encodedToken: string): Promise<string> {
    return Buffer.from(encodedToken, 'base64').toString('utf-8');
  }

  async addVerificationToken(
    data: Prisma.VerificationTokenCreateInput,
  ): Promise<VerificationToken> {
    try {
      return await this.prismaService.verificationToken.create({ data });
    } catch (error) {
      console.error('Error creating verification token:', error);
      throw new InternalServerErrorException(
        'Failed to create verification token',
      );
    }
  }

  async findVerificationToken(token: string): Promise<VerificationToken> {
    try {
      return await this.prismaService.verificationToken.findFirst({
        where: { token },
      });
    } catch (error) {
      console.error('Error finding verification token:', error);
      throw new InternalServerErrorException(
        'Failed to find verification token',
      );
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new InternalServerErrorException('Failed to hash password');
    }
  }

  async verifyEmail(verificationToken: string): Promise<boolean> {
    try {
      const token = await this.prismaService.verificationToken.findUnique({
        where: { token: verificationToken },
      });

      if (!token) {
        return false;
      }
      const tokenExpirationDate = new Date(token.expired_at);
      if (tokenExpirationDate <= getCurrentTimestamp()) {
        return false;
      }
      const updatedVerificationToken =
        await this.prismaService.verificationToken.update({
          where: { token: verificationToken },
          data: { is_used: true },
        });

      if (!updatedVerificationToken) {
        return false;
      }

      await this.prismaService.user.update({
        where: { id: token.user_id },
        data: { is_email_verified: true },
      });

      return true;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async verifyPassword(
    hashedPassword: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw new InternalServerErrorException('Failed to verify password');
    }
  }
}
