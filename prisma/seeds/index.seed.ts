import { PrismaClient } from '@prisma/client';
import UserRolesSeed from './user.roles.seed';
import StatusPaymentSeed from './status.payment.seed';
import TokenTypesSeed from './token.types.seed';
import AuthSeed from './auth.seed';

const prisma = new PrismaClient();

async function main() {
  await UserRolesSeed(prisma);
  await StatusPaymentSeed(prisma);
  await TokenTypesSeed(prisma);
  await AuthSeed(prisma);
}

main()
  .then(() => console.log('🌱 seeds was successfully!'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
