import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class EnvsConfigService {
  constructor(private readonly configService: NestConfigService) {}

  getPort(): number {
    return this.configService.get<number>('PORT') ?? 3000;
  }

  getDatabaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }

  getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  getJwtExpirationTime(): string {
    return this.configService.get<string>('JWT_EXPIRATION_TIME');
  }

  getManagerPassword(): string {
    return this.configService.get<string>('MANAGER_PASSWORD');
  }

  getManagerEmail(): string {
    return this.configService.get<string>('MANAGER_EMAIL');
  }

  getEmailHost(): string {
    return this.configService.get<string>('EMAIL_HOST');
  }

  getEmailPort(): number {
    return this.configService.get<number>('EMAIL_PORT') ?? 587;
  }

  getEmailUser(): string {
    return this.configService.get<string>('EMAIL_USER');
  }

  getEmailPassword(): string {
    return this.configService.get<string>('EMAIL_PASSWORD');
  }

  getEmailFrom(): string {
    return this.configService.get<string>('EMAIL_FROM');
  }

  getBaseUrl(): string {
    return this.configService.get<string>('BASE_URL');
  }

  getStripeAPIKey(): string {
    return this.configService.get<string>('STRIPE_API_KEY');
  }

  getStripeWebhookSecret(): string {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  getCloudinaryCloudName(): string {
    return this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
  }

  getCloudinaryApiKey(): string {
    return this.configService.get<string>('CLOUDINARY_API_KEY');
  }

  getCloudinaryApiSecret(): string {
    return this.configService.get<string>('CLOUDINARY_API_SECRET');
  }

  getCorsOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN');
  }

  getCorsClientDomain(): string {
    return this.configService.get<string>('CORS_CLIENT_DOMAIN');
  }

  getThrottleTTL(): number {
    return this.configService.get<number>('THROTTLE_TTL');
  }

  getThrottleLimit(): number {
    return this.configService.get<number>('THROTTLE_LIMIT');
  }

  getNodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') ?? 'development';
  }
}
