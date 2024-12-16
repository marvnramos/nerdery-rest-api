import {
  BadRequestException,
  Body,
  Controller, Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupReqDto } from './dto/requests/signup.req.dto';
import { SignUpResDto } from './dto/responses/signup.res.dto';
import { randomUUID } from 'crypto';
import { MailService } from '../utils/mailer/mail.service';
import { getExpirationTimestamp } from '../utils/timestamp';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
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

    const user = await this.usersService.create(userData);

    const token = randomUUID();
    await this.usersService.addVerificationToken({
      token: token,
      is_used: false,
      expired_at: getExpirationTimestamp(),
      user: {
        connect: { id: user.id },
      },
      tokenType: {
        connect: { id: 1 },
      },
    });

    const encodedToken = await this.usersService.encodeVerificationToken(token);
    await this.mailService.sendUserConfirmationEmail(
      req.email,
      `${user.first_name} ${user.last_name}`,
      encodedToken,
    );

    return {
      created_at: user.created_at,
    };
  }

  @Get('validate-email/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateEmail(@Param('token') token: string): Promise<void> {
    const decodedToken = await this.usersService.decodeVerificationToken(token);
    await this.usersService.verifyEmail(decodedToken);
  }
}
