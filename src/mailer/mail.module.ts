import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { EnvsConfigModule } from '../config/envs.config.module';
import { EnvsConfigService } from '../config/envs.config.service';

@Module({
  imports: [
    EnvsConfigModule,
    MailerModule.forRootAsync({
      imports: [EnvsConfigModule],
      inject: [EnvsConfigService],
      useFactory: async (envsConfigService: EnvsConfigService) => ({
        transport: {
          host: envsConfigService.getEmailHost(),
          port: envsConfigService.getEmailPort(),
          secure: false,
          auth: {
            user: envsConfigService.getEmailUser(),
            pass: envsConfigService.getEmailPassword(),
          },
        },
        defaults: {
          from: envsConfigService.getEmailFrom(),
        },
        template: {
          dir: process.cwd() + '/public/templates/mails',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
