import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
    try {
      const category = await this.findCategoryByName(data.category_name);
      if (category) {
        throw new BadRequestException('Category already exists');
      }
      return this.prismaService.category.create({ data });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      console.error('Error creating category:', error);
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  async removeCategory(id: number): Promise<Category> {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    try {
      return await this.prismaService.category.delete({ where: { id } });
    } catch (error) {
      console.error(`Error deleting category with id ${id}:`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete category');
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const categories: Category[] =
        await this.prismaService.category.findMany();
      if (categories.length === 0) {
        throw new NotFoundException(`Categories not found`);
      }
      return this.prismaService.category.findMany();
    } catch (error) {
      console.error('Error finding all categories:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to find all categories');
    }
  }

  async findCategoryByName(name: string): Promise<Category | null> {
    try {
      return this.prismaService.category.findFirst({
        where: { category_name: name },
      });
    } catch (error) {
      console.error(`Error finding category with name ${error}`);
      throw new InternalServerErrorException('Failed to find category by name');
    }
  }
}
