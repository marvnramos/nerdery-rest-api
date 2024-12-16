import { PrismaClient } from '@prisma/client';
import UserRolesSeed from './user.roles.seed';
import StatusPaymentSeed from './status.payment.seed';
import TokenTypesSeed from './token.types.seed';
import * as process from 'node:process';

const prisma = new PrismaClient();
async function main() {
  await UserRolesSeed(prisma);
  await StatusPaymentSeed(prisma);
  await TokenTypesSeed(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
