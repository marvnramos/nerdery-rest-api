import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { SignInReqDto } from './dto/request/sign.in.req.dto';
import { AuthLocal } from './decorators/auth.local.decorator';
import { Auth } from './decorators/auth.role.decorator';
import { UserRoleType } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @AuthLocal()
  async login(@Body() req: SignInReqDto, @Res() res: Response): Promise<void> {
    return this.authService.login(req, res);
  }

  @Post('logout')
  @Auth(UserRoleType.CLIENT, UserRoleType.MANAGER)
  async logout(@Res() res: Response): Promise<void> {
    return this.authService.logout(res);
  }
}
