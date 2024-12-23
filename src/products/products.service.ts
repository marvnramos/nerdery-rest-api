import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaServce: PrismaService) {}

  async createProduct(data: Prisma.ProductCreateInput): Promise<Product> {
    try {
      return await this.prismaServce.product.create({ data });
    } catch (error) {
      console.error('Error creating product:', error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }
}
