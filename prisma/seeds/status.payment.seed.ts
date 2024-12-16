import { PrismaClient, StatusPayment, StatusPaymentType } from '@prisma/client';

export default async (prisma: PrismaClient): Promise<StatusPayment[]> => {
  return Promise.all([
    prisma.statusPayment.upsert({
      where: { id: 1 },
      create: { id: 1, status: StatusPaymentType.PENDING },
      update: {},
    }),
    prisma.statusPayment.upsert({
      where: { id: 2 },
      create: { id: 2, status: StatusPaymentType.COMPLETED },
      update: {},
    }),
    prisma.statusPayment.upsert({
      where: { id: 3 },
      create: { id: 3, status: StatusPaymentType.FAILED },
      update: {},
    }),
  ]);
};
