import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EmailType } from '../enums/email.types';

export class EmailCommand {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(EmailType)
  @IsNotEmpty()
  emailType: EmailType;

  @IsString()
  @IsNotEmpty()
  template: string;
}
