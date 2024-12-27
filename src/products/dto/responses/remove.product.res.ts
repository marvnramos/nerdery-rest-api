import { Field, ObjectType } from '@nestjs/graphql';
import { IRemoveRecordRes } from '../../../utils/interfaces/IRemoveRecordRes';
import { Expose } from 'class-transformer';

@ObjectType({
  implements: () => [IRemoveRecordRes],
})
export class RemoveProductRes implements IRemoveRecordRes {
  @Field(() => Date!, { name: 'deleted_at' })
  @Expose({ name: 'deleted_at' })
  deletedAt: Date;
}
