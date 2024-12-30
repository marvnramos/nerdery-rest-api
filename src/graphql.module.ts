import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.graphql'),
      playground: process.env.NODE_ENV !== 'production',
      debug: true,
      context: ({ req, res }) => ({ request: req, response: res }),
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
})
export class GraphqlModule {}
