import { UseFilters } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { GlobalExceptionFilter } from '../../utils/exception/GlobalExceptionFilter';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { AddProductArgs } from './dto/args/add.product.args';
import { UpdateProductArgs } from './dto/args/update.product.args';
import { UpdateProductCategoriesArgs } from './dto/args/update.product.categories.args';
import { GetProductsArgs } from './dto/args/get.products.args';
import { AddProductRes } from './dto/responses/create.product.res';
import { UpdateProductRes } from './dto/responses/update.product.images.res';
import { RemoveProductRes } from './dto/responses/remove.product.res';
import { GetProductsRes } from './dto/responses/get.products.res';
import { ProductType } from './types/product.type';
import { Categories } from '../categories/models/categories.model';
import { ProductImagesType } from './types/product.images.type';
import { UserRoleType } from '@prisma/client';

@UseFilters(new GlobalExceptionFilter())
@Resolver(() => ProductType)
export class ProductsResolver {
  constructor(private readonly productService: ProductsService) {}

  @Auth(UserRoleType.MANAGER)
  @Mutation(() => AddProductRes)
  async addProduct(@Args('data') data: AddProductArgs): Promise<AddProductRes> {
    return this.productService.createProduct(data);
  }

  @Auth(UserRoleType.MANAGER)
  @Mutation(() => UpdateProductRes)
  async updateProduct(
    @Args('id') id: string,
    @Args('data') data: UpdateProductArgs,
  ): Promise<UpdateProductRes> {
    return this.productService.editProductData(id, data);
  }

  @Auth(UserRoleType.MANAGER)
  @Mutation(() => RemoveProductRes)
  async removeProduct(@Args('id') id: string): Promise<RemoveProductRes> {
    return this.productService.removeProduct(id);
  }

  @Auth(UserRoleType.MANAGER)
  @Mutation(() => UpdateProductRes)
  async updateProductCategories(
    @Args('data') data: UpdateProductCategoriesArgs,
  ): Promise<UpdateProductRes> {
    return this.productService.updateProductCategories(data);
  }

  @Query(() => ProductType)
  async getProductById(@Args('id') id: string): Promise<ProductType> {
    return this.productService.getProductById(id);
  }

  @Query(() => GetProductsRes)
  async getProductsPagination(
    @Args('data') data: GetProductsArgs,
  ): Promise<GetProductsRes> {
    return this.productService.getPaginatedProducts(data);
  }

  @ResolveField(() => [Categories])
  async categories(@Parent() product: ProductType): Promise<Categories[]> {
    return this.productService.getProductCategories(product.id);
  }

  @ResolveField(() => [ProductImagesType])
  async images(@Parent() product: ProductType): Promise<ProductImagesType[]> {
    return this.productService.getProductImages(product.id);
  }
}
