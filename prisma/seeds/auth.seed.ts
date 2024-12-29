import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export default async (prisma: PrismaClient): Promise<User> => {
  const email = process.env.MANAGER_EMAIL;
  const password = bcrypt.hashSync(process.env.MANAGER_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    create: {
      first_name: 'manager',
      last_name: 'admin',
      email,
      is_email_verified: true,
      role_id: 1,
      address: 'admins streets 0291',
      password,
    },
    update: {},
  });
};
