import { InputType, Field, Int } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class GetProductsArgs {
  @Field(() => Int!)
  @IsInt()
  first: number;

  @Field(() => String!, { nullable: true })
  @IsOptional()
  @IsString()
  after?: string;

  @Field(() => [Int], { name: 'category_ids', nullable: true })
  @Expose({ name: 'category_ids' })
  @IsOptional()
  @IsInt({ each: true })
  categoriesIds?: number[];
}
