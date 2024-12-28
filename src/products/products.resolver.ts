import { UseFilters } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AddProductArgs } from './dto/args/add.product.args';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { ProductsService } from './products.service';
import { plainToInstance } from 'class-transformer';
import { Auth } from 'src/auth/decorators/auth.role.decorator';
import { AddProductRes } from './dto/responses/create.product.res';
import { UpdateProductRes } from './dto/responses/update.product.images.res';
import { UpdateProductArgs } from './dto/args/update.product.args';
import { RemoveProductRes } from './dto/responses/remove.product.res';
import { UpdateProductCategoriesArgs } from './dto/args/update.product.categories.args';
import { GetProductsArgs } from './dto/args/get.products.args';
import { GetProductsRes } from './dto/responses/get.products.res';
import { Product } from './models/products.model';
import { Categories } from 'src/categories/models/categories.model';
import { ProductImages } from './models/product.images.model';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productService: ProductsService) {}

  @Auth('MANAGER')
  @Mutation(() => AddProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async addProduct(@Args('data') data: AddProductArgs): Promise<AddProductRes> {
    const product = await this.productService.createProduct(data);
    return plainToInstance(AddProductRes, product);
  }

  @Auth('MANAGER')
  @Mutation(() => UpdateProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async updateProduct(
    @Args('id') id: string,
    @Args('data') data: UpdateProductArgs,
  ): Promise<UpdateProductRes> {
    const product = await this.productService.editProductData(id, data);
    return plainToInstance(UpdateProductRes, product);
  }

  @Auth('MANAGER')
  @Mutation(() => RemoveProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async removeProduct(@Args('id') id: string): Promise<RemoveProductRes> {
    await this.productService.removeProduct(id);
    const response = new RemoveProductRes();
    response.deletedAt = new Date();
    return response;
  }

  @Auth('MANAGER')
  @Mutation(() => UpdateProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async updateProductCategories(
    @Args('data') data: UpdateProductCategoriesArgs,
  ): Promise<UpdateProductRes> {
    const product = await this.productService.updateProductCategories(data);
    return product;
  }

  @Query(() => GetProductsRes)
  @UseFilters(new GlobalExceptionFilter())
  async getProducts(
    @Args('data') data: GetProductsArgs,
  ): Promise<GetProductsRes> {
    return this.productService.getProducts(data);
  }

  @ResolveField(() => [Categories])
  async categories(@Parent() product: Product): Promise<Categories[]> {
    return await this.productService.getProductCategories(product.id);
  }

  @ResolveField(() => [ProductImages])
  async images(@Parent() product: Product): Promise<ProductImages[]> {
    return await this.productService.getProductImages(product.id);
  }
}
