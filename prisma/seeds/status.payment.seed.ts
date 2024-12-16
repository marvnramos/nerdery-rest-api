import { PrismaClient, StatusPayment, StatusPaymentType } from '@prisma/client';

export default async (prisma: PrismaClient): Promise<StatusPayment[]> => {
  return Promise.all([
    prisma.statusPayment.upsert({
      where: { id: 1 },
      create: { status: StatusPaymentType.PENDING },
      update: {},
    }),
    prisma.statusPayment.upsert({
      where: { id: 2 },
      create: { status: StatusPaymentType.COMPLETED },
      update: {},
    }),
    prisma.statusPayment.upsert({
      where: { id: 3 },
      create: { status: StatusPaymentType.FAILED },
      update: {},
    }),
  ]);
};
