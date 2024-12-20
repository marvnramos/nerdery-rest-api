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
import { getExpirationTimestamp } from '../utils/timestamp';
import { ForgotPasswordReqDto } from './dto/requests/forgot.password.req.dto';
import { ResetPasswordResDto } from './dto/responses/reset.password.res.dto';
import { Response } from 'express';
import { ResetPasswordReqDto } from './dto/requests/reset.password.req.dto';
import { VerificationTokenService } from '../verification.token/verification.token.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly mailService: MailService,
  ) {}

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
      subject: 'Email Verification',
      template: './confirmation',
      fullName: `${user.first_name} ${user.last_name}`,
      token: encodedToken,
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
        template: './reset-password',
        fullName: `${user.first_name} ${user.last_name}`,
        token: encodedToken,
      }),
    ]);

    return { message: 'Email sent' };
  }

  @Get('reset-password/:token')
  @Render('reset-password-view')
  resetPasswordView(@Param('token') token: string, @Res() res: Response) {
    res.cookie('token', token, { httpOnly: false, maxAge: 900_000 });
  }

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

    if (!isPasswordReset) {
      throw new BadRequestException(
        'This link has expired or is already used.',
      );
    }
  }
}
