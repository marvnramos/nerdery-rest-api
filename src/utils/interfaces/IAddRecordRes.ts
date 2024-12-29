import { Field, ID, InterfaceType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@InterfaceType()
export abstract class IAddRecordRes {
  @Field(() => ID!)
  id: string;

  @Field(() => Date!, { name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;
}
