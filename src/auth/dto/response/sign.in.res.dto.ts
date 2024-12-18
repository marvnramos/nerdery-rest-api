import { Expose } from 'class-transformer';

export class SignInResDto {
  @Expose({ name: 'access_token' })
  accessToken: string;
}
