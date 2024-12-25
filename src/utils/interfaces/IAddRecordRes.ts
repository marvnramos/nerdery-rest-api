import { Field, ID, InterfaceType } from '@nestjs/graphql';

@InterfaceType()
export abstract class IAddRecordRes {
  @Field(() => ID!)
  id: string;

  @Field(() => Date!, { name: 'created_at' })
  createdAt: Date;
}
