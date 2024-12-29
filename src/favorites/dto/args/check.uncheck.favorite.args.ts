import { InputType, Field, ID } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class CheckUncheckFavoriteArgs {
  @Field(() => ID!, { name: 'product_id' })
  @Expose({ name: 'product_id' })
  @IsString({ message: 'Product id must be a string' })
  @IsNotEmpty({ message: 'Product id not exist' })
  @IsUUID('4', { message: 'Product id must be a valid UUID' })
  productId: string;
}
