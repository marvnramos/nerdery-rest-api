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
import { GlobalExceptionFilter } from '../utils/exception/GlobalExceptionFilter';
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

@Resolver(() => ProductType)
export class ProductsResolver {
  constructor(private readonly productService: ProductsService) {}

  @Auth('MANAGER')
  @Mutation(() => AddProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async addProduct(@Args('data') data: AddProductArgs): Promise<AddProductRes> {
    return this.productService.createProduct(data);
  }

  @Auth('MANAGER')
  @Mutation(() => UpdateProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async updateProduct(
    @Args('id') id: string,
    @Args('data') data: UpdateProductArgs,
  ): Promise<UpdateProductRes> {
    return this.productService.editProductData(id, data);
  }

  @Auth('MANAGER')
  @Mutation(() => RemoveProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async removeProduct(@Args('id') id: string): Promise<RemoveProductRes> {
    return this.productService.removeProduct(id);
  }

  @Auth('MANAGER')
  @Mutation(() => UpdateProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async updateProductCategories(
    @Args('data') data: UpdateProductCategoriesArgs,
  ): Promise<UpdateProductRes> {
    return this.productService.updateProductCategories(data);
  }

  @Query(() => ProductType)
  @UseFilters(new GlobalExceptionFilter())
  async getProductById(@Args('id') id: string): Promise<ProductType> {
    return this.productService.getProductById(id);
  }

  @Query(() => GetProductsRes)
  @UseFilters(new GlobalExceptionFilter())
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
