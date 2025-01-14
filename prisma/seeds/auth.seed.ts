import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EnvsConfigService } from '../../utils/config/envs.config.service';
import { ConfigService } from '@nestjs/config';

export default async (prisma: PrismaClient): Promise<User> => {
  const configService = new ConfigService();
  const envConfigService = new EnvsConfigService(configService);

  const email = envConfigService.getManagerEmail();
  const password = bcrypt.hashSync(envConfigService.getManagerPassword(), 10);

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
