import { Expose } from 'class-transformer';

export class SignUpResDto {
  @Expose()
  created_at: Date;
}
