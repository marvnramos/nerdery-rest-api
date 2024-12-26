import { UseFilters } from '@nestjs/common';
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AddProductReq } from './dto/requests/create.product.req';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { ProductsService } from './products.service';
import { plainToInstance } from 'class-transformer';
import { Auth } from 'src/auth/decorators/auth.role.decorator';
import { AddProductRes } from './dto/responses/create.product.res';
import { UpdateProductRes } from './dto/responses/update.product.images.req';
import { UpdateProductReq } from './dto/requests/update.product.req';

@Resolver()
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
}
