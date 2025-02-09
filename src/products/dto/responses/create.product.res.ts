import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IAddRecordRes } from '../../../utils/interfaces/IAddRecordRes';

@ObjectType({
  implements: () => [IAddRecordRes],
})
export class AddProductRes implements IAddRecordRes {
  @Field(() => ID!)
  id: string;

  @Field(() => Date!, { name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;
}
