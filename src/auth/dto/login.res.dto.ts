import { Expose } from 'class-transformer';

export class LoginResDto {
  @Expose({ name: 'access_token' })
  accessToken: string;
}
