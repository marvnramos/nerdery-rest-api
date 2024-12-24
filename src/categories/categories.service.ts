import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
    const existingCategory = await this.findCategoryByName(data.category_name);
    if (existingCategory) {
      throw new BadRequestException('Category already exists');
    }
    return this.prismaService.category.create({ data });
  }

  async removeCategory(id: number): Promise<Category> {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return this.prismaService.category.delete({ where: { id } });
  }

  async getAllCategories(): Promise<Category[]> {
    const categories = await this.prismaService.category.findMany();
    if (categories.length === 0) {
      throw new NotFoundException('No categories found');
    }
    return categories;
  }

  async findCategoryByName(name: string): Promise<Category> {
    const category = await this.prismaService.category.findFirst({
      where: { category_name: name },
    });

    if (!category) {
      throw new NotFoundException(`Category with name ${name} not found`);
    }
    return category;
  }
}
