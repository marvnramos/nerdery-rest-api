import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EnvsConfigModule } from './config/envs.config.module';
import { EnvsConfigService } from './config/envs.config.service';
import { DataLoaderModule } from './data.loader/data.loader.module';
import { DataLoaderService } from './data.loader/data.loader.service';

@Module({
  imports: [
    EnvsConfigModule,
    DataLoaderModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [EnvsConfigModule, DataLoaderModule],
      inject: [EnvsConfigService, DataLoaderService],
      useFactory: async (
        envsConfigService: EnvsConfigService,
        dataloaderService: DataLoaderService,
      ) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.graphql'),
        playground: envsConfigService.getNodeEnv() !== 'production',
        debug: true,
        context: ({ req, res }) => ({
          request: req,
          response: res,
          loaders: dataloaderService.getLoaders(),
        }),
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
