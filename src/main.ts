import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './utils/GlobalExceptionFilter';
import * as process from 'node:process';
import { CspMiddleware } from './utils/CspMiddleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(new CspMiddleware().use);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  app.enableCors({
    origin: [process.env.CORS_ORIGIN, process.env.CORS_CLIENT_DOMAIN],
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
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
