import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../utils/prisma/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';
import { VerificationTokenService } from '../verification.token/verification.token.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly verificationTokenService: VerificationTokenService,
  ) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.prismaService.user.create({ data });
    } catch {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prismaService.user.findUnique({ where: { email } });
    } catch {
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    } catch {
      throw new InternalServerErrorException('Failed to hash password');
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prismaService.user.findUnique({ where: { id } });
    } catch {
      throw new InternalServerErrorException('Failed to find user by id');
    }
  }

  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const user = await this.findById(userId);
      return this.prismaService.userRole.findUnique({
        where: { id: user.role_id },
      });
    } catch {
      throw new InternalServerErrorException('Failed to find user by user');
    }
  }

  async resetPassword(
    verificationToken: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      const token =
        await this.verificationTokenService.findVerificationToken(
          verificationToken,
        );
      if (!this.isValidToken(token, 2)) {
        return false;
      }

      await this.prismaService.user.update({
        where: { id: token.user_id },
        data: { password: hashedPassword },
      });

      await this.markTokenAsUsed(token.id);

      return true;
    } catch {
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  async verifyEmail(verificationToken: string): Promise<boolean> {
    try {
      const token =
        await this.verificationTokenService.findVerificationToken(
          verificationToken,
        );
      if (!this.isValidToken(token, 1)) {
        return false;
      }

      await this.prismaService.user.update({
        where: { id: token.user_id },
        data: { is_email_verified: true },
      });

      await this.markTokenAsUsed(token.id);

      return true;
    } catch {
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async markTokenAsUsed(tokenId: string): Promise<void> {
    await this.prismaService.verificationToken.update({
      where: { id: tokenId },
      data: { is_used: true },
    });
  }

  private isValidToken(token: any, expectedTypeId: number): boolean {
    if (!token) {
      return false;
    }

    if (token.token_type_id !== expectedTypeId) {
      return false;
    }

    if (token.is_used) {
      return false;
    }

    const tokenExpirationDate = new Date(token.expired_at);
    if (new Date() > tokenExpirationDate) {
      return false;
    }

    return true;
  }
}
