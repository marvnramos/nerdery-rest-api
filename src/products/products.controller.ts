import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { GlobalExceptionFilter } from '../utils/GlobalExceptionFilter';
import { Auth } from '../auth/decorators/auth.role.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateProductImagesArgs } from './dto/args/update.product.images.args';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Auth('MANAGER')
  @Patch(':productId/images')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseFilters(new GlobalExceptionFilter())
  @UseInterceptors(FilesInterceptor('images'))
  async updateProductImages(
    @Param('productId') productId: string,
    @UploadedFiles() uploadedImages: Express.Multer.File[],
    @Body() updateImagesDto: UpdateProductImagesArgs,
  ): Promise<void> {
    this.validateUpdateImagesRequest(updateImagesDto, uploadedImages);

    if (updateImagesDto.op === 'add') {
      for (const uploadedImage of uploadedImages) {
        await this.productsService.uploadImage(uploadedImage, productId);
      }
    } else if (updateImagesDto.op === 'remove') {
      for (const publicImageId of updateImagesDto.publicImageId) {
        await this.productsService.removeProductImages(publicImageId);
      }
    }
  }

  private validateUpdateImagesRequest(
    { op, path, publicImageId }: UpdateProductImagesArgs,
    uploadedImages: Express.Multer.File[],
  ): void {
    if (path !== '/images') {
      throw new BadRequestException(
        'Invalid path. Only "/images" is supported.',
      );
    }

    if (op === 'add' && (!uploadedImages || uploadedImages.length === 0)) {
      throw new BadRequestException(
        'At least one image file is required for the "add" operation.',
      );
    }

    if (op === 'remove' && (!publicImageId || publicImageId.length === 0)) {
      throw new BadRequestException(
        'At least one image identifier is required for the "remove" operation.',
      );
    }

    if (!['add', 'remove'].includes(op)) {
      throw new BadRequestException(
        'Invalid operation. Supported: "add", "remove".',
      );
    }
  }
}
