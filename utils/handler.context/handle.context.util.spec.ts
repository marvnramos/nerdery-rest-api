import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { extractRequestFromContext } from './handle.context.util';

describe('extractRequestFromContext', () => {
  let mockHttpRequest;
  let mockGqlRequest;

  beforeEach(() => {
    mockHttpRequest = { user: { id: 1, role: 'TEST_ROLE' } };
    mockGqlRequest = { user: { id: 2, role: 'TEST_ROLE' } };
  });

  it('should return the HTTP request object when context type is "http"', () => {
    const mockExecutionContext = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockHttpRequest),
      }),
    };

    const result = extractRequestFromContext(
      mockExecutionContext as unknown as ExecutionContext,
    );

    expect(result).toBe(mockHttpRequest);
    expect(mockExecutionContext.getType).toHaveBeenCalledTimes(1);
    expect(
      mockExecutionContext.switchToHttp().getRequest,
    ).toHaveBeenCalledTimes(1);
  });

  it('should return the GraphQL request object when context type is "graphql"', () => {
    const mockExecutionContext = {
      getType: jest.fn().mockReturnValue('graphql'),
    };
    const mockGqlContext = {
      getContext: jest.fn().mockReturnValue({ request: mockGqlRequest }),
    };

    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

    const result = extractRequestFromContext(
      mockExecutionContext as unknown as ExecutionContext,
    );

    expect(result).toBe(mockGqlRequest);
    expect(mockExecutionContext.getType).toHaveBeenCalledTimes(1);
    expect(GqlExecutionContext.create).toHaveBeenCalledWith(
      mockExecutionContext,
    );
    expect(mockGqlContext.getContext).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException when context type is unsupported', () => {
    const mockExecutionContext = {
      getType: jest.fn().mockReturnValue('unsupported-type'),
    };

    expect(() =>
      extractRequestFromContext(
        mockExecutionContext as unknown as ExecutionContext,
      ),
    ).toThrow(
      new UnauthorizedException('Unsupported context type: unsupported-type'),
    );

    expect(mockExecutionContext.getType).toHaveBeenCalledTimes(1);
  });
});
