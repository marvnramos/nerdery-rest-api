import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export default async (prisma: PrismaClient): Promise<User> => {
  return prisma.user.upsert({
    where: { email: 'manager@example.com' },
    create: {
      first_name: 'manager',
      last_name: 'admin',
      email: 'manager@example.com',
      is_email_verified: true,
      role_id: 1,
      address: 'admins streets 0291',
      password: bcrypt.hashSync(process.env.MANAGER_PASSWORD, 10),
    },
    update: {},
  });
};
