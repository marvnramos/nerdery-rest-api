import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';

@InputType()
export class GetOrderArgs {
  @Field(() => ID!, { name: 'order_id' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @Expose({ name: 'order_id' })
  orderId: string;
}
