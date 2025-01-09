import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { EnvsConfigService } from '../../../utils/config/envs.config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly envsConfigService: EnvsConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envsConfigService.getJwtSecret(),
    });
  }

  async validate(payload: {
    sub: string;
    role: string;
  }): Promise<{ id: string; role: string }> {
    return { id: payload.sub, role: payload.role };
  }
}
