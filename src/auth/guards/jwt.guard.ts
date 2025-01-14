import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { extractRequestFromContext } from '../../../utils/handler.context/handle.context.util';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Promise<any> {
    return extractRequestFromContext(context);
  }
}
