import { Module } from '@nestjs/common';
import { VerificationTokenService } from './verification.token.service';
import { PrismaModule } from '../utils/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VerificationTokenService],
  exports: [VerificationTokenService],
})
export class VerificationTokenModule {}
