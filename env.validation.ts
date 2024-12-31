import {
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

class EnvironmentVariables {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsNumber()
  @IsDefined()
  PORT: number;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  JWT_EXPIRATION_TIME: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  MANAGER_PASSWORD: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  MANAGER_EMAIL: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  EMAIL_HOST: string;

  @IsInt()
  @IsDefined()
  EMAIL_PORT: number;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  EMAIL_USER: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  EMAIL_PASSWORD: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  EMAIL_FROM: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  BASE_URL: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  STRIPE_API_KEY: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  STRIPE_WEBHOOK_SECRET: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  CLOUDINARY_CLOUD_NAME: string;

  @IsInt()
  @IsDefined()
  CLOUDINARY_API_KEY: number;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  CLOUDINARY_API_SECRET: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  CORS_ORIGIN: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  CORS_CLIENT_DOMAIN: string;

  @IsDefined()
  @IsInt()
  THROTTLE_TTL: number;

  @IsDefined()
  @IsInt()
  THROTTLE_LIMIT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
