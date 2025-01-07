import { GlobalExceptionFilter } from './GlobalExceptionFilter';
import {
  HttpException,
  HttpStatus,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Request, Response } from 'express';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockLoggerError: jest.SpyInstance;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockLoggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      method: 'GET',
      url: '/test-endpoint',
    };
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getType: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch (GraphQL context)', () => {
    it('should log error and throw GraphQLError with proper extensions when an HttpException is thrown', () => {
      const mockGqlHost = {
        getInfo: jest.fn().mockReturnValue({ fieldName: 'testQuery' }),
      };
      GqlArgumentsHost.create = jest.fn().mockReturnValue(mockGqlHost);
      mockArgumentsHost.getType = jest.fn().mockReturnValue('graphql');

      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      expect(() =>
        filter.catch(exception, mockArgumentsHost as ArgumentsHost),
      ).toThrow(GraphQLError);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'GraphQL Exception thrown in query testQuery: Test error',
        expect.anything(),
      );
    });

    it('should log error and throw GraphQLError with status 500 and code InternalServerError when a non-HttpException is thrown', () => {
      const mockGqlHost = {
        getInfo: jest.fn().mockReturnValue({ fieldName: 'testQuery' }),
      };
      GqlArgumentsHost.create = jest.fn().mockReturnValue(mockGqlHost);
      mockArgumentsHost.getType = jest.fn().mockReturnValue('graphql');

      const exception = new Error('Non-HttpException error');

      expect(() =>
        filter.catch(exception, mockArgumentsHost as ArgumentsHost),
      ).toThrow(GraphQLError);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'GraphQL Exception thrown in query testQuery: Non-HttpException error',
        expect.anything(),
      );
    });
  });

  describe('catch (HTTP context)', () => {
    it('should log error and return a JSON response with proper status and error details when an HttpException is thrown', () => {
      mockArgumentsHost.getType = jest.fn().mockReturnValue('http');
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'HTTP Exception thrown for request GET /test-endpoint: Test error',
        expect.anything(),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [
          {
            message: 'Test error',
            extensions: {
              code: 'InternalServerError',
              date: expect.any(String),
              status: HttpStatus.BAD_REQUEST,
              path: '/test-endpoint',
              method: 'GET',
            },
          },
        ],
      });
    });

    it('should log error and return a JSON response with status 500 and error code InternalServerError when a non-HttpException is thrown', () => {
      mockArgumentsHost.getType = jest.fn().mockReturnValue('http');
      const exception = new Error('Non-HttpException error');

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'HTTP Exception thrown for request GET /test-endpoint: Non-HttpException error',
        expect.anything(),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [
          {
            message: 'Internal server error',
            extensions: {
              code: 'InternalServerError',
              date: expect.any(String),
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              path: '/test-endpoint',
              method: 'GET',
            },
          },
        ],
      });
    });
  });

  describe('catch (Unknown context)', () => {
    it('should not log or respond if context type is neither graphql nor http', () => {
      mockArgumentsHost.getType = jest.fn().mockReturnValue('unknown');

      const exception = new Error('Unknown context error');

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockLoggerError).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
