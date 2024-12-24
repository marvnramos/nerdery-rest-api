import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Categories } from './models/categories.model';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql.jwt.guard';
import { AddCategoryReq } from './dto/requests/create.category.req';
import { CategoriesService } from './categories.service';
import { plainToInstance } from 'class-transformer';

@Resolver()
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}
  @Mutation(() => Categories)
  @UseGuards(GqlJwtAuthGuard)
  /**
   * TODO: Add Roles Guard
   */
  async addCategory(@Args('data') data: AddCategoryReq): Promise<Categories> {
    const { categoryName } = data;
    const category = await this.categoriesService.createCategory({
      category_name: categoryName,
    });

    return plainToInstance(Categories, category);
  }
}
