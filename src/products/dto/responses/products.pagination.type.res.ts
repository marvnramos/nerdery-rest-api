import { ObjectType } from '@nestjs/graphql';
import PaginationType from '../../../../utils/pagination/pagination.util';
import { ProductType } from '../../types/product.type';

@ObjectType()
export class PaginatedProductsType extends PaginationType(ProductType) {}
