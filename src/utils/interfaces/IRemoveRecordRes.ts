import { Field, InterfaceType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@InterfaceType()
export abstract class IRemoveRecordRes {
  @Field(() => Date!, { name: 'deleted_at' })
  @Expose({ name: 'deleted_at' })
  deletedAt: Date;
}
