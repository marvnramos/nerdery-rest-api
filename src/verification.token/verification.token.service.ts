import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../utils/prisma/prisma.service';
import { VerificationToken, Prisma } from '@prisma/client';
import { encodeBase64 } from 'src/utils/tools';
import { decodeBase64 } from 'src/utils/tools';

@Injectable()
export class VerificationTokenService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    data: Prisma.VerificationTokenCreateInput,
  ): Promise<VerificationToken> {
    try {
      return await this.prismaService.verificationToken.create({ data });
    } catch (error) {
      console.error('Error creating verification token:', error);
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
    } catch (error) {
      console.error('Error finding verification token:', error);
      throw new InternalServerErrorException(
        'Failed to find verification token',
      );
    }
  }
}
