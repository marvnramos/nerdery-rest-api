import { Field, InterfaceType } from '@nestjs/graphql';

@InterfaceType()
export abstract class IUpdateRecordRes {
  @Field(() => Date!, { name: 'updated_at' })
  updatedAt: Date;
}
