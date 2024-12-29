import { Field, InputType, ID, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsNotEmpty, IsString, IsInt } from 'class-validator';
import { OperationType } from '../../../utils/enums/operation.enum';

@InputType()
export class UpdateProductCategoriesArgs {
  @Field(() => ID!)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => String!)
  @IsEnum(OperationType)
  op: OperationType;

  @Field(() => [Int!]!)
  @IsArray()
  @IsInt({ each: true })
  categories: number[];
}
