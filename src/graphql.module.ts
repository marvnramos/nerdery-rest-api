import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EnvsConfigModule } from './config/envs.config.module';
import { EnvsConfigService } from './config/envs.config.service';

@Module({
  imports: [
    EnvsConfigModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [EnvsConfigModule],
      inject: [EnvsConfigService],
      useFactory: async (envsConfigService: EnvsConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.graphql'),
        playground: envsConfigService.getNodeEnv() !== 'production',
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
    }),
  ],
})
export class GraphqlModule {}
