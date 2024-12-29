import { Field, ID, InputType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class AddOrderArgs {
  @Field(() => ID!, { name: 'cart_id' })
  @Expose({ name: 'cart_id' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  cartId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nearbyLandmark?: string;
}
