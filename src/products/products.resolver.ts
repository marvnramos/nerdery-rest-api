import { UseFilters } from '@nestjs/common';
import {
  Resolver,
  Mutation,
  Args,
  Query,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { AddProductReq } from './dto/requests/create.product.req';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { ProductsService } from './products.service';
import { plainToInstance } from 'class-transformer';
import { Auth } from 'src/auth/decorators/auth.role.decorator';
import { AddProductRes } from './dto/responses/create.product.res';
import { UpdateProductRes } from './dto/responses/update.product.images.res';
import { UpdateProductReq } from './dto/requests/update.product.req';
import { RemoveProductRes } from './dto/responses/remove.product.res';
import { UpdateProductCategoriesReq } from './dto/requests/update.product.categories.req';
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
  async addProduct(@Args('data') data: AddProductReq): Promise<AddProductRes> {
    const product = await this.productService.createProduct(data);
    return plainToInstance(AddProductRes, product);
  }

  @Auth('MANAGER')
  @Mutation(() => UpdateProductRes)
  @UseFilters(new GlobalExceptionFilter())
  async updateProduct(
    @Args('id') id: string,
    @Args('data') data: UpdateProductReq,
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
    @Args('data') data: UpdateProductCategoriesReq,
  ): Promise<UpdateProductRes> {
    const product = await this.productService.updateProductCategories(data);
    return product;
  }

  @Auth('MANAGER')
  @Query(() => GetProductsRes)
  @UseFilters(new GlobalExceptionFilter())
  async getProducts(
    @Args('data') data: GetProductsArgs,
  ): Promise<GetProductsRes> {
    return this.productService.getProducts(data);
  }

  @ResolveField(() => [Categories])
  async categories(@Parent() product: Product): Promise<Categories[]> {
    const productCategories = await this.productService.getProductCategories(
      product.id,
    );
    return productCategories;
  }

  @ResolveField(() => [ProductImages])
  async images(@Parent() product: Product): Promise<ProductImages[]> {
    const productImages = await this.productService.getProductImages(
      product.id,
    );
    return productImages;
  }
}
