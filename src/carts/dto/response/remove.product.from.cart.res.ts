import { Field, ObjectType } from '@nestjs/graphql';
import { IRemoveRecordRes } from '../../../../utils/interfaces/IRemoveRecordRes';

@ObjectType({
  implements: () => [IRemoveRecordRes],
})
export class RemoveProductFromCartRes implements IRemoveRecordRes {
  @Field(() => Date, { name: 'deleted_at' })
  deletedAt: Date;
}
