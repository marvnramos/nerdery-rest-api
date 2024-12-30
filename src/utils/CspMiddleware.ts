import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, Request, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CspMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.nonce = nonce;

    res.setHeader(
      'Content-Security-Policy',
      `script-src 'self' 'nonce-${nonce}'`,
    );

    next();
  }
}
