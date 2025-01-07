import { ObjectType } from '@nestjs/graphql';
import PaginationType from '../../../utils/pagination/pagination';
import { OrderType } from '../../types/order.type';

@ObjectType()
export class PaginatedOrdersType extends PaginationType(OrderType) {}
