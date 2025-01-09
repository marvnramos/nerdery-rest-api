import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { extractRequestFromContext } from '../../../utils/HandleContext';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Promise<any> {
    return extractRequestFromContext(context);
  }
}
