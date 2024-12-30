import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  template: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  uri?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  image?: string;

  @IsInt()
  @IsOptional()
  unitPrice?: number;
}
