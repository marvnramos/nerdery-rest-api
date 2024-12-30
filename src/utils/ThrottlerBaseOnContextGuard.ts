import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class ThrottlerBasedOnContextGuard extends ThrottlerGuard {
  /**
   * Extracts the request and response objects based on the execution context type.
   * @param context ExecutionContext - The current execution context.
   * @returns An object containing the request and response objects.
   * @throws UnauthorizedException if the context type is unsupported.
   */
  getRequestResponse(context: ExecutionContext): { req: any; res: any } {
    const contextType = context.getType<string>();

    if (contextType === 'http') {
      const httpContext = context.switchToHttp();
      return {
        req: httpContext.getRequest(),
        res: httpContext.getResponse(),
      };
    }

    if (contextType === 'graphql') {
      const graphqlContext = GqlExecutionContext.create(context);
      const ctx = graphqlContext.getContext<{
        request: any;
        response: any;
      }>();
      return { req: ctx.request, res: ctx.response };
    }

    throw new UnauthorizedException(`Unsupported context type: ${contextType}`);
  }
}
