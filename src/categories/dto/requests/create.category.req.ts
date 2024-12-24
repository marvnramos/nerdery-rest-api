import { InputType, Field } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class AddCategoryReq {
  @Field(() => String!, { name: 'category_name' })
  @Expose({ name: 'category_name' })
  @IsString()
  @IsNotEmpty()
  categoryName: string;
}
