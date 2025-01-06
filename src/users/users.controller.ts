import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Render,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupReqDto } from './dto/requests/signup.req.dto';
import { SignUpResDto } from './dto/responses/signup.res.dto';
import { randomUUID } from 'crypto';
import { MailService } from '../utils/mailer/mail.service';
import { getExpirationTimestamp } from '../utils/tools';
import { ForgotPasswordReqDto } from './dto/requests/forgot.password.req.dto';
import { ResetPasswordResDto } from './dto/responses/reset.password.res.dto';
import { Response } from 'express';
import { ResetPasswordReqDto } from './dto/requests/reset.password.req.dto';
import { VerificationTokenService } from '../verification.token/verification.token.service';
import { seconds, Throttle } from '@nestjs/throttler';
import { EnvsConfigService } from '../config/envs.config.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly mailService: MailService,
    private readonly envsConfigService: EnvsConfigService,
  ) {}

  private baseUrl = this.envsConfigService.getBaseUrl();

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() req: SignupReqDto): Promise<SignUpResDto> {
    const existingUser = await this.usersService.findByEmail(req.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    req.password = await this.usersService.hashPassword(req.password);
    const userData = { ...req, is_email_verified: false };

    const userPromise = this.usersService.create(userData);
    const token = randomUUID();
    const tokenData = {
      token,
      is_used: false,
      expired_at: getExpirationTimestamp(),
      user: { connect: { id: (await userPromise).id } },
      tokenType: { connect: { id: 1 } },
    };

    const [user, , encodedToken] = await Promise.all([
      userPromise,
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

  @Get('validate-email/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateEmail(@Param('token') token: string): Promise<void> {
    const decodedToken =
      await this.verificationTokenService.decodeVerificationToken(token);
    const verifiedEmail = await this.usersService.verifyEmail(decodedToken);
    if (!verifiedEmail) {
      throw new BadRequestException(
        'This link has expired or is already used.',
      );
    }
  }

  @Throttle({ default: { ttl: seconds(60), limit: 1 } })
  @Put('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(
    @Body() req: ForgotPasswordReqDto,
  ): Promise<ResetPasswordResDto> {
    const user = await this.usersService.findByEmail(req.email);
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

  @Throttle({ default: { ttl: seconds(60), limit: 3 } })
  @Get('reset-password/:token')
  @Render('reset-password-view')
  resetPasswordView(@Param('token') token: string, @Res() res: Response) {
    const nonce = res.locals.nonce;
    res.cookie('token', token, { httpOnly: false, maxAge: 900_000 });
    return { nonce };
  }

  @Throttle({ default: { ttl: seconds(60), limit: 3 } })
  @Put('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() req: ResetPasswordReqDto) {
    const [decodedToken, hashedPassword] = await Promise.all([
      this.verificationTokenService.decodeVerificationToken(req.token),
      this.usersService.hashPassword(req.new_password),
    ]);

    const isPasswordReset = await this.usersService.resetPassword(
      decodedToken,
      hashedPassword,
    );

    const token =
      await this.verificationTokenService.findVerificationToken(decodedToken);
    const user = await this.usersService.findById(token.user_id);
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
}
