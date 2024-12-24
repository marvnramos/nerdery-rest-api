import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Promise<any> {
    const contextType = context.getType<string>();

    switch (contextType) {
      case 'http':
        return context.switchToHttp().getRequest();
      case 'graphql':
        const gqlContext = GqlExecutionContext.create(context);
        return gqlContext.getContext().request;
      default:
        throw new UnauthorizedException(
          `Unsupported context type: ${contextType}`,
        );
    }
  }
}
