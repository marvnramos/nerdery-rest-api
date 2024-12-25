import { Field, ObjectType } from '@nestjs/graphql';
import { IUpdateRecordRes } from '../../../utils/interfaces/IUpdateRecordRes';

@ObjectType({
  implements: () => IUpdateRecordRes,
})
export class UpdateProductRes implements IUpdateRecordRes {
  @Field(() => Date, { name: 'updated_at' })
  updatedAt: Date;
}
