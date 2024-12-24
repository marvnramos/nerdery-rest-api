import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';
import { PrismaModule } from 'src/utils/prisma/prisma.module';
import { ProductsController } from './products.controller';
import { CloudinaryModule } from '../utils/cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  providers: [ProductsService, ProductsResolver],
  exports: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
