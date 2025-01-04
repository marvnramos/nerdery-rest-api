import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../utils/prisma/prisma.service';
import { VerificationToken, Prisma } from '@prisma/client';
import { encodeBase64, decodeBase64 } from '../utils/tools';

@Injectable()
export class VerificationTokenService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    data: Prisma.VerificationTokenCreateInput,
  ): Promise<VerificationToken> {
    try {
      return await this.prismaService.verificationToken.create({ data });
    } catch {
      throw new InternalServerErrorException(
        'Failed to create verification token',
      );
    }
  }

  async encodeVerificationToken(token: string): Promise<string> {
    return encodeBase64(token);
  }

  async decodeVerificationToken(encodedToken: string): Promise<string> {
    return decodeBase64(encodedToken);
  }

  async findVerificationToken(token: string): Promise<VerificationToken> {
    try {
      return await this.prismaService.verificationToken.findUnique({
        where: { token },
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to find verification token',
      );
    }
  }
}
