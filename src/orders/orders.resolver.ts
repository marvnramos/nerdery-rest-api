import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class OrdersResolver {
  @Query(() => String)
  Orders(): string[] {
    return ["John's order", "Marta's order"];
  }
}
