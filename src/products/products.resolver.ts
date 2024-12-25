import { UseFilters } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Product } from './models/products.model';
import { AddProductReq } from './dto/requests/create.product.req';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { ProductsService } from './products.service';
import { plainToInstance } from 'class-transformer';
import { Auth } from 'src/auth/decorators/auth.role.decorator';

@Resolver()
export class ProductsResolver {
  constructor(private readonly productService: ProductsService) {}

  @Auth('MANAGER')
  @Mutation(() => Product)
  @UseFilters(new GlobalExceptionFilter())
  async addProduct(@Args('data') data: AddProductReq): Promise<Product> {
    const product = await this.productService.createProduct(data);
    console.log('done ✅');
    return plainToInstance(Product, product);
  }

  @Query(() => String)
  publicResource(): string {
    return 'Public resource';
  }
}
