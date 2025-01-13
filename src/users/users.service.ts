import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';
import { VerificationTokenService } from '../verification.token/verification.token.service';
import * as bcrypt from 'bcrypt';
import { SignupReqDto } from './dto/requests/signup.req.dto';
import { SignUpResDto } from './dto/responses/signup.res.dto';
import { randomUUID } from 'crypto';
import { getExpirationTimestamp } from '../../utils/time.util';
import { MailService } from '../mailer/mail.service';
import { EnvsConfigService } from '../../utils/config/envs.config.service';
import { ForgotPasswordReqDto } from './dto/requests/forgot.password.req.dto';
import { ResetPasswordResDto } from './dto/responses/reset.password.res.dto';
import { Response } from 'express';
import { ResetPasswordReqDto } from './dto/requests/reset.password.req.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly mailService: MailService,
    private readonly envsConfigService: EnvsConfigService,
  ) {}

  private get baseUrl(): string {
    return this.envsConfigService.getBaseUrl();
  }

  async signUp(req: SignupReqDto): Promise<SignUpResDto> {
    const existingUser = await this.findByEmail(req.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    req.password = await this.hashPassword(req.password);
    const userData = { ...req, is_email_verified: false };

    const user = await this.create(userData);
    const token = randomUUID();
    const tokenData = {
      token,
      is_used: false,
      expired_at: getExpirationTimestamp(),
      user: { connect: { id: user.id } },
      tokenType: { connect: { id: 1 } },
    };

    const [, encodedToken] = await Promise.all([
      this.verificationTokenService.create(tokenData),
      this.verificationTokenService.encodeVerificationToken(token),
    ]);

    await this.mailService.sendEmail({
      email: user.email,
      fullName: `${user.first_name} ${user.last_name}`,
      subject: 'Email Verification',
      uri: `${this.baseUrl}/users/validate-email/${encodedToken}`,
      template: './confirmation',
    });

    return {
      created_at: user.created_at,
    };
  }

  async validateEmail(token: string) {
    const decodedToken =
      await this.verificationTokenService.decodeVerificationToken(token);
    const verifiedEmail = await this.verifyEmail(decodedToken);
    if (!verifiedEmail) {
      throw new BadRequestException(
        'This link has expired or is already used.',
      );
    }
  }

  async forgotPassword(
    req: ForgotPasswordReqDto,
  ): Promise<ResetPasswordResDto> {
    const user = await this.findByEmail(req.email);
    if (!user) {
      throw new BadRequestException('Email not found');
    }

    const token = randomUUID();
    const tokenData = {
      token,
      is_used: false,
      expired_at: getExpirationTimestamp(),
      user: { connect: { id: user.id } },
      tokenType: { connect: { id: 2 } },
    };

    const encodedToken =
      await this.verificationTokenService.encodeVerificationToken(token);
    await Promise.all([
      this.verificationTokenService.create(tokenData),
      this.mailService.sendEmail({
        email: user.email,
        subject: 'Reset Password',
        uri: `${this.baseUrl}/users/reset-password/${encodedToken}`,
        template: './reset-password',
        fullName: `${user.first_name} ${user.last_name}`,
      }),
    ]);

    return { message: 'Email sent' };
  }

  resetPasswordView(token: string, res: Response) {
    const nonce = res.locals.nonce;
    res.cookie('token', token, { httpOnly: false, maxAge: 900_000 });
    return { nonce };
  }

  async resetPassword(req: ResetPasswordReqDto): Promise<void> {
    const [decodedToken, hashedPassword] = await Promise.all([
      this.verificationTokenService.decodeVerificationToken(req.token),
      this.hashPassword(req.new_password),
    ]);

    const isPasswordReset = await this.updatePassword(
      decodedToken,
      hashedPassword,
    );

    const token =
      await this.verificationTokenService.findVerificationToken(decodedToken);
    const user = await this.findById(token.user_id);
    await this.mailService.sendEmail({
      email: user.email,
      fullName: `${user.first_name} ${user.last_name}`,
      subject: 'Password Reset',
      template: './reset-password-confirmation',
    });

    if (!isPasswordReset) {
      throw new BadRequestException(
        'This link has expired or is already used.',
      );
    }
  }

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

  async updatePassword(
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
