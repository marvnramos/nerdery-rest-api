import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignInReqDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  password: string;
}
