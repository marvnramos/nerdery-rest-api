import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Categories } from './models/categories.model';
import { AddCategoryReq } from './dto/requests/create.category.req';
import { CategoriesService } from './categories.service';
import { plainToInstance } from 'class-transformer';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { DeleteCategoryReq } from './dto/requests/delete.category.req';
import { DeleteCategoryRes } from './dto/responses/delete.category.res';
import { AddCategoryRes } from './dto/responses/create.category.res';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { UseFilters } from '@nestjs/common';

@Resolver()
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseFilters(new GlobalExceptionFilter())
  @Mutation(() => AddCategoryRes)
  @Auth('MANAGER')
  async addCategory(
    @Args('data') data: AddCategoryReq,
  ): Promise<AddCategoryRes> {
    const { categoryName } = data;
    const category = await this.categoriesService.createCategory({
      category_name: categoryName,
    });
    return plainToInstance(AddCategoryRes, category);
  }

  @Mutation(() => DeleteCategoryRes)
  @Auth('MANAGER')
  async deleteCategory(
    @Args('data') data: DeleteCategoryReq,
  ): Promise<DeleteCategoryRes> {
    await this.categoriesService.removeCategory(data.id);

    const response = new DeleteCategoryRes();
    response.deletedAt = new Date();
    return response;
  }

  @Query(() => [Categories])
  @Auth('MANAGER')
  async getCategories(): Promise<Categories[]> {
    const categories = await this.categoriesService.getAllCategories();
    return plainToInstance(Categories, categories);
  }
}
