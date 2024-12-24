import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
    try {
      return this.prismaService.category.create({ data });
    } catch (error) {
      console.error('Error creating category:', error);
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  async removeCategory(id: number): Promise<Category> {
    try {
      return this.prismaService.category.delete({ where: { id } });
    } catch (error) {
      console.error(`Error deleting category with id ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete category');
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      return this.prismaService.category.findMany();
    } catch (error) {
      console.error('Error finding all categories:', error);
      throw new InternalServerErrorException('Failed to find all categories');
    }
  }

  async findCategoryById(id: number): Promise<Category | null> {
    try {
      return this.prismaService.category.findUnique({ where: { id } });
    } catch (error) {
      console.error(`Error finding category with id ${id}:`, error);
      throw new InternalServerErrorException('Failed to find category by id');
    }
  }
}
