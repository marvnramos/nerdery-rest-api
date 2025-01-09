import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { extractRequestFromContext } from '../../../utils/HandleContext';

jest.mock('../../../utils/HandleContext', () => ({
  extractRequestFromContext: jest.fn(),
}));

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  it('should return true if no roles are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    const mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue(() => {}),
    } as unknown as ExecutionContext;

    const result = rolesGuard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(reflector.get).toHaveBeenCalledWith('roles', expect.any(Function));
  });

  it('should return true if the user has a required role', () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue(['MANAGER_TEST', 'CLIENT_TEST']);
    (extractRequestFromContext as jest.Mock).mockReturnValue({
      user: { role: 'MANAGER_TEST' },
    });

    const mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue(() => {}),
    } as unknown as ExecutionContext;

    const result = rolesGuard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(reflector.get).toHaveBeenCalledWith('roles', expect.any(Function));
    expect(extractRequestFromContext).toHaveBeenCalledWith(
      mockExecutionContext,
    );
  });

  it('should throw UnauthorizedException if the user or role is missing', () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue(['MANAGER_TEST', 'CLIENT_TEST']);
    (extractRequestFromContext as jest.Mock).mockReturnValue({});

    const mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue(() => {}),
    } as unknown as ExecutionContext;

    expect(() => rolesGuard.canActivate(mockExecutionContext)).toThrow(
      new UnauthorizedException('User not authenticated or role missing'),
    );

    expect(reflector.get).toHaveBeenCalledWith('roles', expect.any(Function));
    expect(extractRequestFromContext).toHaveBeenCalledWith(
      mockExecutionContext,
    );
  });
});
