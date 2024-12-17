import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as process from 'node:process';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendUserConfirmationEmail(
    email: string,
    fullName: string,
    token: string,
  ) {
    const url = `${process.env.BASE_URL}/users/validate-email/${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Confirm your email',
      template: './confirmation',
      context: {
        name: fullName,
        url,
      },
    });
  }

  async sendResetPasswordEmail(email: string, fullName: string, token: string) {
    const url = `${process.env.BASE_URL}/users/reset-password/${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password',
      template: './reset-password',
      context: {
        name: fullName,
        url,
      },
    });
  }
}
