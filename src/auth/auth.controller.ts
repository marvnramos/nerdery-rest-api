import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { SignInResDto } from './dto/response/sign.in.res.dto';
import { UsersService } from 'src/users/users.service';
import { SignInReqDto } from './dto/request/sign.in.req.dto';
import { AuthLocal } from './decorators/auth.local.decorator';
import { Auth } from './decorators/auth.role.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('login')
  @AuthLocal()
  async login(@Body() req: SignInReqDto, @Res() res: Response): Promise<void> {
    const user = await this.userService.findByEmail(req.email);
    const response: SignInResDto = await this.authService.login(user);

    res.cookie('access_token', response.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000,
      sameSite: 'strict',
    });

    res.json(response);
  }

  @Post('logout')
  @Auth('CLIENT', 'MANAGER')
  async logout(@Res() res: Response): Promise<void> {
    res.clearCookie('access_token');
    res.json({ message: 'Logged out successfully' });
  }
}
