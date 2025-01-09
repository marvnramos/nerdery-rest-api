import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IUpdateRecordRes } from '../../../../utils/interfaces/IUpdateRecordRes';

@ObjectType({
  implements: () => [IUpdateRecordRes],
})
export class UpdateProductCartRes implements IUpdateRecordRes {
  @Field(() => Date, { name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
