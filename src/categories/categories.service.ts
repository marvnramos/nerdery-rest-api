import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { Categories } from './models/categories.model';
import { DeleteCategoryRes } from './dto/responses/delete.category.res';
import { AddCategoryRes } from './dto/responses/create.category.res';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCategory(categoryName: string): Promise<AddCategoryRes> {
    const existingCategory = await this.findCategoryByName(categoryName);
    if (existingCategory) {
      throw new BadRequestException('Category already exists');
    }

    const category = await this.prismaService.category.create({
      data: { category_name: categoryName },
    });
    return plainToInstance(AddCategoryRes, category);
  }

  async removeCategory(id: number): Promise<DeleteCategoryRes> {
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

    if (productCategories.length > 0) {
      throw new NotAcceptableException('Category is in use');
    }

    await this.prismaService.category.delete({ where: { id } });

    return plainToInstance(DeleteCategoryRes, { deletedAt: new Date() });
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
