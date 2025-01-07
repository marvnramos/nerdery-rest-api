import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EnvsConfigService } from './envs.config.service';

describe('EnvsConfigService', () => {
  let envsConfigService: EnvsConfigService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const mockEnv = {
        PORT: 4000,
        JWT_SECRET: 'test-jwt-secret',
        JWT_EXPIRATION_TIME: '3600s',
        MANAGER_PASSWORD: 'test-manager-password',
        MANAGER_EMAIL: 'manager@example.com',
        EMAIL_HOST: 'smtp.example.com',
        EMAIL_PORT: 2525,
        EMAIL_USER: 'test@example.com',
        EMAIL_PASSWORD: 'password123',
        EMAIL_FROM: 'noreply@example.com',
        BASE_URL: 'http://localhost:3000',
        STRIPE_API_KEY: 'stripe-api-key',
        STRIPE_WEBHOOK_SECRET: 'stripe-webhook-secret',
        CLOUDINARY_CLOUD_NAME: 'cloud-name',
        CLOUDINARY_API_KEY: 'cloudinary-api-key',
        CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
        CORS_ORIGIN: '*',
        CORS_CLIENT_DOMAIN: 'http://example.com',
        THROTTLE_TTL: 60,
        THROTTLE_LIMIT: 10,
        NODE_ENV: 'test',
      };
      return mockEnv[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvsConfigService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    envsConfigService = module.get<EnvsConfigService>(EnvsConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(envsConfigService).toBeDefined();
  });

  it('should return correct port', () => {
    expect(envsConfigService.getPort()).toBe(4000);
    expect(configService.get).toHaveBeenCalledWith('PORT');
  });

  it('should return correct JWT secret', () => {
    expect(envsConfigService.getJwtSecret()).toBe('test-jwt-secret');
    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('should return correct JWT expiration time', () => {
    expect(envsConfigService.getJwtExpirationTime()).toBe('3600s');
    expect(configService.get).toHaveBeenCalledWith('JWT_EXPIRATION_TIME');
  });

  it('should return correct manager password', () => {
    expect(envsConfigService.getManagerPassword()).toBe(
      'test-manager-password',
    );
    expect(configService.get).toHaveBeenCalledWith('MANAGER_PASSWORD');
  });

  it('should return correct manager email', () => {
    expect(envsConfigService.getManagerEmail()).toBe('manager@example.com');
    expect(configService.get).toHaveBeenCalledWith('MANAGER_EMAIL');
  });

  it('should return correct email host', () => {
    expect(envsConfigService.getEmailHost()).toBe('smtp.example.com');
    expect(configService.get).toHaveBeenCalledWith('EMAIL_HOST');
  });

  it('should return correct email port', () => {
    expect(envsConfigService.getEmailPort()).toBe(2525);
    expect(configService.get).toHaveBeenCalledWith('EMAIL_PORT');
  });

  it('should return correct email user', () => {
    expect(envsConfigService.getEmailUser()).toBe('test@example.com');
    expect(configService.get).toHaveBeenCalledWith('EMAIL_USER');
  });

  it('should return correct email password', () => {
    expect(envsConfigService.getEmailPassword()).toBe('password123');
    expect(configService.get).toHaveBeenCalledWith('EMAIL_PASSWORD');
  });

  it('should return correct email from', () => {
    expect(envsConfigService.getEmailFrom()).toBe('noreply@example.com');
    expect(configService.get).toHaveBeenCalledWith('EMAIL_FROM');
  });

  it('should return correct base URL', () => {
    expect(envsConfigService.getBaseUrl()).toBe('http://localhost:3000');
    expect(configService.get).toHaveBeenCalledWith('BASE_URL');
  });

  it('should return correct Stripe API key', () => {
    expect(envsConfigService.getStripeAPIKey()).toBe('stripe-api-key');
    expect(configService.get).toHaveBeenCalledWith('STRIPE_API_KEY');
  });

  it('should return correct Stripe webhook secret', () => {
    expect(envsConfigService.getStripeWebhookSecret()).toBe(
      'stripe-webhook-secret',
    );
    expect(configService.get).toHaveBeenCalledWith('STRIPE_WEBHOOK_SECRET');
  });

  it('should return correct Cloudinary cloud name', () => {
    expect(envsConfigService.getCloudinaryCloudName()).toBe('cloud-name');
    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_CLOUD_NAME');
  });

  it('should return correct Cloudinary API key', () => {
    expect(envsConfigService.getCloudinaryApiKey()).toBe('cloudinary-api-key');
    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_API_KEY');
  });

  it('should return correct Cloudinary API secret', () => {
    expect(envsConfigService.getCloudinaryApiSecret()).toBe(
      'cloudinary-api-secret',
    );
    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_API_SECRET');
  });

  it('should return correct CORS origin', () => {
    expect(envsConfigService.getCorsOrigin()).toBe('*');
    expect(configService.get).toHaveBeenCalledWith('CORS_ORIGIN');
  });

  it('should return correct CORS client domain', () => {
    expect(envsConfigService.getCorsClientDomain()).toBe('http://example.com');
    expect(configService.get).toHaveBeenCalledWith('CORS_CLIENT_DOMAIN');
  });

  it('should return correct throttle TTL', () => {
    expect(envsConfigService.getThrottleTTL()).toBe(60);
    expect(configService.get).toHaveBeenCalledWith('THROTTLE_TTL');
  });

  it('should return correct throttle limit', () => {
    expect(envsConfigService.getThrottleLimit()).toBe(10);
    expect(configService.get).toHaveBeenCalledWith('THROTTLE_LIMIT');
  });

  it('should return correct node environment', () => {
    expect(envsConfigService.getNodeEnv()).toBe('test');
    expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
  });
});
