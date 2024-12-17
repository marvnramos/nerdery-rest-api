import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class SignupReqDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'first_name' })
  first_name: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'last_name' })
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  password: string;
}
