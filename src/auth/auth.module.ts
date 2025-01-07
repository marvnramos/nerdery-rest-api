import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { EnvsConfigModule } from '../config/envs.config.module';
import { EnvsConfigService } from 'src/config/envs.config.service';

@Module({
  imports: [
    EnvsConfigModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [EnvsConfigModule],
      inject: [EnvsConfigService],
      useFactory: async (envsConfigService: EnvsConfigService) => {
        return {
          secret: envsConfigService.getJwtSecret(),
          signOptions: { expiresIn: envsConfigService.getJwtExpirationTime() },
        };
      },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
