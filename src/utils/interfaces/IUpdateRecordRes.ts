import { Field, InterfaceType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@InterfaceType()
export abstract class IUpdateRecordRes {
  @Field(() => Date!, { name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
