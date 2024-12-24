import { SetMetadata, UseGuards } from '@nestjs/common';
import { UserRoleType } from '@prisma/client';
import { applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';

export function Auth(...roles: UserRoleType[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
