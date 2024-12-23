import { Field, InputType, ID } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsArray,
  IsPositive,
  IsNumber,
} from 'class-validator';

@InputType()
export class AddProductReq {
  @Field(() => String, { name: 'product_name' })
  @Expose({ name: 'product_name' })
  @IsString()
  productName: string;

  @Field(() => String)
  @IsString()
  description: string;

  @Field(() => Number)
  @IsInt()
  @IsPositive()
  stock: number;

  @Field(() => [ID])
  @IsArray()
  categories: string[];

  @Field(() => Boolean, { name: 'is_available' })
  @Expose({ name: 'is_available' })
  @IsBoolean()
  isAvailable: boolean;

  @Field(() => String!, { name: 'image_base64' })
  @Expose({ name: 'image_base64' })
  @IsString()
  imageBase64: string;

  @Field(() => Number!, { name: 'unit_price' })
  @Expose({ name: 'unit_price' })
  @IsNumber()
  @IsPositive()
  unitPrice: number;
}