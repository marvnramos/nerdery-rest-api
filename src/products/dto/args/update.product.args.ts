import { Field, InputType, Int } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

@InputType()
export class UpdateProductArgs {
  @Field(() => String, { nullable: true, name: 'product_name' })
  @Expose({ name: 'product_name' })
  @IsOptional()
  @IsString()
  productName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @Field(() => Boolean, { nullable: true, name: 'is_available' })
  @Expose({ name: 'is_available' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @Field(() => Int, { nullable: true, name: 'unit_price' })
  @Expose({ name: 'unit_price' })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}
