import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IRemoveRecordRes } from '../../../utils/interfaces/IRemoveRecordRes';

@ObjectType({
  implements: () => [IRemoveRecordRes],
})
export class RemoveFavoriteRes implements IRemoveRecordRes {
  @Field(() => Date!, { name: 'deleted_at' })
  @Expose({ name: 'deleted_at' })
  deletedAt: Date;
}
