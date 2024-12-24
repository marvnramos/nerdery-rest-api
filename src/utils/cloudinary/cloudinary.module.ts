import { Module } from '@nestjs/common';
import { ProductImageProvider } from './cloudinary.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProductImageProvider],
  exports: [ProductImageProvider],
})
export class CloudinaryModule {}
