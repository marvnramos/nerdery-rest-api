import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User | null> {
    const user = await this.prismaService.user.create({ data });
    if (!user) {
      return null;
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findFirst({ where: { email } });
    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
}
