import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordReqDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
