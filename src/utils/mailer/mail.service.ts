import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailCommand } from './dto/email.command';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(emailCommand: EmailCommand) {
    await this.mailerService.sendMail({
      to: emailCommand.email,
      subject: emailCommand.subject,
      template: emailCommand.template,
      context: {
        name: emailCommand.fullName,
        url: emailCommand.uri,
      },
    });
  }
}
