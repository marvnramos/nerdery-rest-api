import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Categories } from './models/categories.model';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql.jwt.guard';
import { AddCategoryReq } from './dto/requests/create.category.req';
import { CategoriesService } from './categories.service';
import { Prisma } from '@prisma/client';

@Resolver()
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}
  @Mutation(() => Categories)
  @UseGuards(GqlJwtAuthGuard)
  /**
   * TODO: Add Roles Guard
   */
  async addCategory(@Args('data') data: AddCategoryReq): Promise<Categories> {
    const datas: Prisma.CategoryCreateInput = {
      category_name: data.categoryName,
    };
    return await this.categoriesService.createCategory(datas);
  }
}

// @ObjectType()
// export class Categories {
//   @Field(() => ID)
//   id: string;

//   @Field({ name: 'category_name' })
//   categoryName: string;

//   @Field({ name: 'created_at' })
//   createdAt: Date;

//   @Field({ name: 'updated_at' })
//   updatedAt: Date;
// }

// (alias) type Category = {
//     id: number;
//     category_name: string;
//     created_at: Date;
//     updated_at: Date;
// }
