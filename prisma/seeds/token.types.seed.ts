import { PrismaClient, VerificationTokenType, TokenType } from '@prisma/client';

export default async (
  prisma: PrismaClient,
): Promise<VerificationTokenType[]> => {
  return Promise.all([
    prisma.verificationTokenType.upsert({
      where: { id: 1 },
      create: { token_type: TokenType.VERIFICATION_EMAIL },
      update: {},
    }),
    prisma.verificationTokenType.upsert({
      where: { id: 2 },
      create: { token_type: TokenType.RESET_PASSWORD },
      update: {},
    }),
  ]);
};
