import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Expose } from 'class-transformer';
import { OperationType } from '../../../utils/enums/operation.enum';

export class UpdateProductImagesArgs {
  @IsEnum(OperationType)
  op: OperationType;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose({ name: 'public_image_id' })
  publicImageId?: string[];
}
