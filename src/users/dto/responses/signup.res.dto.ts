import { Expose } from 'class-transformer';
import { ICreatedResDto } from '../../../common/ICreatedResDto';

export class SignUpResDto implements ICreatedResDto {
  @Expose()
  created_at: Date;
}
