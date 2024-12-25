import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateProductImagesReq {
  @IsEnum(['add', 'remove'], {
    message: 'Operation must be "add" or "remove".',
  })
  op: 'add' | 'remove';

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose({ name: 'public_image_id' })
  publicImageId?: string[];
}
