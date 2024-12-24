import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { extractRequestFromContext } from '../../utils/HandleContext';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const request = extractRequestFromContext(context);
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException('User not authenticated or role missing');
    }

    return requiredRoles.includes(user.role);
  }
}
