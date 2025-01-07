import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './utils/exception/GlobalExceptionFilter';
import * as process from 'node:process';
import { ContentSecurityPolicyMiddleware } from './utils/middleware/csp.middleware';
import * as bodyParser from 'body-parser';
import { EnvsConfigService } from './config/envs.config.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(EnvsConfigService);

  app.use(new ContentSecurityPolicyMiddleware().use);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  app.use(
    '/api/v1/payments/webhook',
    bodyParser.raw({ type: 'application/json' }),
  );

  app.enableCors({
    origin: [
      configService.getCorsOrigin(),
      configService.getCorsClientDomain(),
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setBaseViewsDir(join(process.cwd(), 'public/templates'));
  app.setViewEngine('hbs');
  await app.listen(configService.getPort() ?? 3000);
}

bootstrap();
