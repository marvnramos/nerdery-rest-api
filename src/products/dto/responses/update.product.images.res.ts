import { Field, ObjectType } from '@nestjs/graphql';
import { IUpdateRecordRes } from '../../../utils/interfaces/IUpdateRecordRes';
import { Expose } from 'class-transformer';

@ObjectType({
  implements: () => IUpdateRecordRes,
})
export class UpdateProductRes implements IUpdateRecordRes {
  @Field(() => Date!, { name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
