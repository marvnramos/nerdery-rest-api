import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class SignupReqDto {
  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'first_name' })
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'last_name' })
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
