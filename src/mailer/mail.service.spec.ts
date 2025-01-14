import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { EmailCommand } from './dto/email.command';

jest.mock('@nestjs-modules/mailer');

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should call sendMail with correct parameters for a valid EmailCommand', async () => {
    const emailCommand: EmailCommand = {
      email: 'test@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      fullName: 'John Doe',
      uri: 'http://example.com',
      productName: 'Sample Product',
      image: 'http://example.com/image.png',
      unitPrice: '100',
    };

    await mailService.sendEmail(emailCommand);

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: emailCommand.email,
      subject: emailCommand.subject,
      template: emailCommand.template,
      context: {
        name: emailCommand.fullName,
        url: emailCommand.uri,
        productName: emailCommand.productName,
        image: emailCommand.image,
        unitPrice: emailCommand.unitPrice,
      },
    });
  });

  it('should handle missing optional fields by using empty strings', async () => {
    const emailCommand: EmailCommand = {
      email: 'test@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      fullName: 'John Doe',
      uri: 'http://example.com',
    };

    await mailService.sendEmail(emailCommand);

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: emailCommand.email,
      subject: emailCommand.subject,
      template: emailCommand.template,
      context: {
        name: emailCommand.fullName,
        url: emailCommand.uri,
        productName: '',
        image: '',
        unitPrice: '',
      },
    });
  });

  it('should throw an error if MailerService.sendMail throws an error', async () => {
    const emailCommand: EmailCommand = {
      email: 'test@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      fullName: 'John Doe',
      uri: 'http://example.com',
    };

    jest
      .spyOn(mailerService, 'sendMail')
      .mockRejectedValueOnce(new Error('Mail error'));

    await expect(mailService.sendEmail(emailCommand)).rejects.toThrow(
      'Mail error',
    );
  });

  it('should work with required fields', async () => {
    const emailCommand: EmailCommand = {
      email: 'test@example.com',
      subject: 'Minimal Subject',
      template: 'minimal-template',
      fullName: 'Minimal User',
      uri: 'http://minimal.example.com',
    };

    await mailService.sendEmail(emailCommand);

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: emailCommand.email,
      subject: emailCommand.subject,
      template: emailCommand.template,
      context: {
        name: emailCommand.fullName,
        url: emailCommand.uri,
        productName: '',
        image: '',
        unitPrice: '',
      },
    });
  });
});
