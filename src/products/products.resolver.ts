import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { GqlJwtAuthGuard } from '../auth/guards/gql.jwt.guard';
import { Product } from './models/products.model';
import { AddProductReq } from './dto/create.input';

@Resolver()
export class ProductsResolver {
  @Mutation(() => Product)
  @UseGuards(GqlJwtAuthGuard)
  async addProduct(@Args('data') data: AddProductReq): Promise<Product> {
    return {
      id: '1',
      productName: data.productName,
      description: data.description,
      stock: data.stock,
      isAvailable: data.isAvailable,
      unitPrice: data.unitPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Query(() => String)
  publicResource(): string {
    return 'Public resource';
  }
}
