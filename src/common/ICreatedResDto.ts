import { Expose } from 'class-transformer';

export class ICreatedResDto {
  @Expose()
  created_at: Date;
}
