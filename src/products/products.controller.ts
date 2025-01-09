import {
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
import { GlobalExceptionFilter } from '../../utils/exception/GlobalExceptionFilter';
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
    await this.productsService.updateProductImages(
      productId,
      uploadedImages,
      updateImagesDto,
    );
  }
}
