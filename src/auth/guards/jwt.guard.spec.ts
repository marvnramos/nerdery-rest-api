import { ExecutionContext } from '@nestjs/common';
import * as utils from '../../../utils/handle.context.util';
import { JwtAuthGuard } from './jwt.guard';

jest.mock('../../../utils/handle.context.util', () => ({
  extractRequestFromContext: jest.fn(),
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    guard = new JwtAuthGuard();
    mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({}),
    } as unknown as ExecutionContext;
  });

  describe('getRequest', () => {
    it('should return a request object when called with a valid ExecutionContext', async () => {
      const expectedRequest = { user: { id: 1, role: 'TEST_ROLE' } };
      (utils.extractRequestFromContext as jest.Mock).mockResolvedValue(
        expectedRequest,
      );

      const result = await guard.getRequest(mockContext);

      expect(result).toEqual(expectedRequest);
      expect(utils.extractRequestFromContext).toHaveBeenCalledWith(mockContext);
    });

    it('should handle cases where extractRequestFromContext throws an error', async () => {
      (utils.extractRequestFromContext as jest.Mock).mockRejectedValue(
        new Error('Failed to extract request'),
      );

      await expect(guard.getRequest(mockContext)).rejects.toThrow(
        'Failed to extract request',
      );
      expect(utils.extractRequestFromContext).toHaveBeenCalledWith(mockContext);
    });

    it('should handle cases where extractRequestFromContext returns null or undefined', async () => {
      (utils.extractRequestFromContext as jest.Mock).mockResolvedValue(null);

      const result = await guard.getRequest(mockContext);

      expect(result).toBeNull();
      expect(utils.extractRequestFromContext).toHaveBeenCalledWith(mockContext);
    });
  });
});
