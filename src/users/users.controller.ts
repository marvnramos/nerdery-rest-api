import {
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
import { ForgotPasswordReqDto } from './dto/requests/forgot.password.req.dto';
import { ResetPasswordResDto } from './dto/responses/reset.password.res.dto';
import { Response } from 'express';
import { ResetPasswordReqDto } from './dto/requests/reset.password.req.dto';
import { seconds, Throttle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() req: SignupReqDto): Promise<SignUpResDto> {
    return this.usersService.signUp(req);
  }

  @Get('validate-email/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async validateEmail(@Param('token') token: string): Promise<void> {
    return this.usersService.validateEmail(token);
  }

  @Throttle({ default: { ttl: seconds(60), limit: 1 } })
  @Put('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(
    @Body() req: ForgotPasswordReqDto,
  ): Promise<ResetPasswordResDto> {
    return this.usersService.forgotPassword(req);
  }

  @Throttle({ default: { ttl: seconds(60), limit: 3 } })
  @Get('reset-password/:token')
  @Render('reset-password-view')
  resetPasswordView(@Param('token') token: string, @Res() res: Response) {
    return this.usersService.resetPasswordView(token, res);
  }

  @Throttle({ default: { ttl: seconds(60), limit: 3 } })
  @Put('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() req: ResetPasswordReqDto) {
    return this.usersService.resetPassword(req);
  }
}
