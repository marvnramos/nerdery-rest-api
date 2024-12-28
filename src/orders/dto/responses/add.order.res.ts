import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IAddRecordRes } from 'src/utils/interfaces/IAddRecordRes';
import { Expose } from 'class-transformer';

@ObjectType({
  implements: () => [IAddRecordRes],
})
export class AddOrderRes implements IAddRecordRes {
  @Field(() => ID!)
  id: string;

  @Field(() => Date!, { name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;
}
