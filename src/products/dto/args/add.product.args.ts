import { Field, InputType, Int } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsArray,
  IsPositive,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

@InputType()
export class AddProductArgs {
  @Field(() => String, { name: 'product_name' })
  @Expose({ name: 'product_name' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field(() => Number)
  @IsInt()
  @IsPositive()
  stock: number;

  @Field(() => [Int])
  @IsArray()
  categories: number[];

  @Field(() => Boolean, { name: 'is_available' })
  @Expose({ name: 'is_available' })
  @IsBoolean()
  isAvailable: boolean;

  @Field(() => Number!, { name: 'unit_price' })
  @Expose({ name: 'unit_price' })
  @IsNumber()
  @IsPositive()
  unitPrice: number;
}
