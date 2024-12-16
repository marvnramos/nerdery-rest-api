import { PrismaClient, UserRole, UserRoleType } from '@prisma/client';

export default async (prisma: PrismaClient): Promise<UserRole[]> => {
  return Promise.all([
    prisma.userRole.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        role: UserRoleType.MANAGER,
      },
      update: {},
    }),
    prisma.userRole.upsert({
      where: { id: 2 },
      create: {
        id: 2,
        role: UserRoleType.CLIENT,
      },
      update: {},
    }),
  ]);
};
