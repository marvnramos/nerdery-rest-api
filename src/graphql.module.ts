import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { OrdersResolver } from './orders/orders.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.graphql'),
      playground: true,
      debug: true,
      context: ({ req }) => ({ request: req }),
      formatError: (error) => {
        const { message, extensions } = error;

        return {
          message,
          extensions: {
            ...extensions,
            stacktrace: undefined,
          },
        };
      },
    }),
  ],
  providers: [OrdersResolver],
})
export class GraphqlModule {}
