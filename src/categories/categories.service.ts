import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { Categories } from './models/categories.model';

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

    const productCategories = await this.prismaService.productCategory.findMany(
      {
        where: { category_id: id },
      },
    );

    if (productCategories) {
      throw new NotAcceptableException('Category is in use');
    }

    return this.prismaService.category.delete({ where: { id } });
  }

  async getAllCategories(): Promise<Categories[]> {
    const categories = await this.prismaService.category.findMany();
    if (categories.length === 0) {
      throw new NotFoundException('No categories found');
    }
    const categoryTypes = categories.map((category) => {
      return plainToInstance(Categories, category);
    });

    return categoryTypes;
  }

  async findCategoryByName(name: string): Promise<Category | null> {
    return this.prismaService.category.findUnique({
      where: { category_name: name },
    });
  }
}
