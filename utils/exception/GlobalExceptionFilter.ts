import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ContextType,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { GraphQLError } from 'graphql';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const contextType = host.getType();

    if (contextType === ('graphql' as ContextType)) {
      const gqlHost = GqlArgumentsHost.create(host);
      const info = gqlHost.getInfo();

      this.logger.error(
        `GraphQL Exception thrown in query ${info.fieldName}: ${exception.message}`,
        exception.stack,
      );

      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const code =
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal server error';

      throw new GraphQLError(
        code['message'] !== undefined ? code['message'] : exception.message,
        {
          extensions: {
            code: code['error'],
            date: new Date().toISOString(),
            status,
          },
        },
      );
    } else if (contextType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      this.logger.error(
        `HTTP Exception thrown for request ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );

      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const code =
        exception instanceof HttpException
          ? exception.getResponse()
          : { message: 'Internal server error', error: 'InternalServerError' };

      response.status(status).json({
        errors: [
          {
            message:
              code['message'] !== undefined
                ? code['message']
                : exception.message,
            extensions: {
              code: code['error'] || 'InternalServerError',
              date: new Date().toISOString(),
              status,
              path: request.url,
              method: request.method,
            },
          },
        ],
      });
    }
  }
}
