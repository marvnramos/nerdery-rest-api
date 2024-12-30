import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Expose } from 'class-transformer';

@InputType()
export class GetOrdersArgs {
  @Field(() => Int)
  @IsInt()
  first: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  after?: string;

  @Field(() => ID, { name: 'user_id', nullable: true })
  @Expose({ name: 'user_id' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId?: string;

  @Field(() => String, { name: 'user_email', nullable: true })
  @Expose({ name: 'user_email' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  userEmail?: string;
}
