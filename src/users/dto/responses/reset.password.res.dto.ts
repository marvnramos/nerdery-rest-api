import { Expose } from 'class-transformer';

export class ResetPasswordResDto {
  @Expose()
  message: string;
}
