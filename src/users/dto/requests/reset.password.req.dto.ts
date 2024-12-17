import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordReqDto {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  token: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  new_password: string;
}
