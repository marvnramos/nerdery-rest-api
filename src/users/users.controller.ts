import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupReqDto } from './dto/requests/signup.req.dto';
import { SignUpResDto } from './dto/responses/signup.res.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
