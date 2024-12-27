import { InputType, Field, Int } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

@InputType()
export class AddProductCartArg {
  @Field(() => String!, { name: 'product_id' })
  @Expose({ name: 'product_id' })
  @IsString({ message: 'Product id must be a string' })
  @IsUUID('4', { message: 'Product id must be a valid UUID' })
  productId: string;

  @Field(() => String!, { name: 'cart_id', nullable: true })
  @Expose({ name: 'cart_id' })
  @IsString({ message: 'Cart id must be a string' })
  @IsUUID('4', { message: 'Cart id must be a valid UUID' })
  @IsOptional()
  cartId?: string;

  @Field(() => Int!)
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(0, { message: 'Quantity must be greater or equal than 0' })
  quantity: number;
}
