import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: { ttl: number; limit: number },
  ): Promise<void> {
    const { ttl, limit } = throttlerLimitDetail;
    throw new ThrottlerException(
      `Too many requests. Please try again in ${ttl / 1000} seconds. Limit: ${limit}`,
    );
  }
}
