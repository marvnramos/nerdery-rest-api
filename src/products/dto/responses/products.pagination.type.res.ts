import { ObjectType } from '@nestjs/graphql';
import PaginationType from '../../../utils/pagination/pagination';
import { ProductType } from '../../types/product.type';

@ObjectType()
export class PaginatedProductsType extends PaginationType(ProductType) {}
