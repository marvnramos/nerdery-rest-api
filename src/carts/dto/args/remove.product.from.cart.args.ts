import { InputType, Field } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsString, IsUUID } from 'class-validator';

@InputType()
export class RemoveProductFromCartArgs {
  @Field(() => String!, { name: 'product_id' })
  @Expose({ name: 'product_id' })
  @IsString({ message: 'Product id must be a string' })
  @IsUUID('4', { message: 'Product id must be a valid UUID' })
  productId: string;

  @Field(() => String!, { name: 'cart_id' })
  @Expose({ name: 'cart_id' })
  @IsString({ message: 'Cart id must be a string' })
  @IsUUID('4', { message: 'Cart id must be a valid UUID' })
  cartId: string;
}
