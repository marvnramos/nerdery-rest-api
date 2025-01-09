import { ContentSecurityPolicyMiddleware } from './csp.middleware';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

jest.mock('crypto', () => ({
  randomBytes: jest
    .fn()
    .mockReturnValue(Buffer.from('mockedrandombytes', 'utf-8')),
}));

describe('ContentSecurityPolicyMiddleware', () => {
  let middleware: ContentSecurityPolicyMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new ContentSecurityPolicyMiddleware();

    req = {};
    res = {
      locals: {},
      setHeader: jest.fn(),
    };
    next = jest.fn();
  });

  describe('use', () => {
    it('should generate a nonce, base64 encode it, and attach it to res.locals', () => {
      middleware.use(req as Request, res as Response, next);

      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(res.locals.nonce).toBe(
        Buffer.from('mockedrandombytes', 'utf-8').toString('base64'),
      );
    });

    it('should set the correct Content-Security-Policy header with the generated nonce', () => {
      middleware.use(req as Request, res as Response, next);

      const expectedNonce = Buffer.from('mockedrandombytes', 'utf-8').toString(
        'base64',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        `script-src 'self' 'nonce-${expectedNonce}'`,
      );
    });

    it('should call next function exactly once after setting the header', () => {
      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
