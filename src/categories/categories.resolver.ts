import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Categories } from './models/categories.model';
import { AddCategoryReq } from './dto/requests/create.category.req';
import { CategoriesService } from './categories.service';
import { plainToInstance } from 'class-transformer';
import { Auth } from '../auth/decorators/auth.role.decorator';

@Resolver()
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}
  @Mutation(() => Categories)
  @Auth('MANAGER')
  async addCategory(@Args('data') data: AddCategoryReq): Promise<Categories> {
    const { categoryName } = data;
    const category = await this.categoriesService.createCategory({
      category_name: categoryName,
    });

    return plainToInstance(Categories, category);
  }
}
