import { ObjectType } from '@nestjs/graphql';
import PaginationType from 'src/utils/pagination/pagination';
import { OrderType } from './order.type';

@ObjectType()
export class PaginatedOrdersType extends PaginationType(OrderType) {}
