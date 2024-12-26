import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product, ProductImages } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { AddProductReq } from './dto/requests/create.product.req';
import { ConfigOptions, v2 as CloudinaryV2 } from 'cloudinary';
import * as streamHelper from 'streamifier';
import { UpdateProductReq } from './dto/requests/update.product.req';
import { filterNullEntries } from '../utils/tools';
import { UpdateProductCategoriesReq } from './dto/requests/update.product.categories.req';
import { OperationType } from '../utils/enums/operation.enum';
import { UpdateProductRes } from './dto/responses/update.product.images.req';

@Injectable()
export class ProductsService {
  private readonly cloudinaryService = CloudinaryV2;

  constructor(private readonly prismaService: PrismaService) {
    const cloudinaryConfig: ConfigOptions = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };

    this.cloudinaryService.config(cloudinaryConfig);
  }

  async createProduct(data: AddProductReq): Promise<Product> {
    const {
      categories,
      productName,
      description,
      stock,
      isAvailable,
      unitPrice,
    } = data;

    const productData: Prisma.ProductCreateInput = {
      product_name: productName,
      description: description,
      stock: stock,
      is_available: isAvailable,
      unit_price: unitPrice,
    };

    const product = await this.prismaService.product.create({
      data: productData,
    });

    await this.createProductCategories(categories, product.id);

    return product;
  }

  async createProductCategories(
    categories: number[],
    productId: string,
  ): Promise<any> {
    return this.prismaService.productCategory.createMany({
      data: categories.map((categoryId) => ({
        category_id: categoryId,
        product_id: productId,
      })),
      skipDuplicates: true,
    });
  }

  async editProductData(id: string, data: UpdateProductReq): Promise<Product> {
    if (data.stock !== undefined) {
      if (data.stock === 0) {
        data.isAvailable = false;
      }
    }

    const toUpdateData = filterNullEntries({
      product_name: data.productName,
      description: data.description,
      stock: data.stock,
      is_available: data.isAvailable,
      unit_price: data.unitPrice,
    });

    return this.prismaService.product.update({
      where: { id },
      data: toUpdateData,
    });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Failed to find product');
    }
    return product;
  }

  async uploadImage(
    image: Express.Multer.File,
    productId: string,
  ): Promise<ProductImages> {
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = this.cloudinaryService.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          },
        );

        streamHelper.createReadStream(image.buffer).pipe(uploadStream);
      });

      const imageData: Prisma.ProductImagesCreateInput = {
        image_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        product: {
          connect: { id: productId },
        },
      };

      return await this.addProductImage(imageData);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async addProductImage(
    data: Prisma.ProductImagesCreateInput,
  ): Promise<ProductImages> {
    const productId = data.product.connect?.id;

    await this.prismaService.product
      .findUnique({
        where: { id: productId },
      })
      .catch((error) => {
        if (error) {
          throw new InternalServerErrorException('Failed to add product');
        }
      });

    return this.prismaService.productImages.create({
      data: {
        image_url: data.image_url,
        public_id: data.public_id,
        product: {
          connect: { id: productId },
        },
      },
    });
  }

  async updateProductCategories(
    data: UpdateProductCategoriesReq,
  ): Promise<UpdateProductRes> {
    await this.findProductById(data.id);
    const response = new UpdateProductRes();
    if (data.op === OperationType.ADD) {
      const categoryToAdd = data.categories.map((category) => ({
        product_id: data.id,
        category_id: category,
      }));

      try {
        await this.prismaService.productCategory.createMany({
          data: categoryToAdd,
          skipDuplicates: true,
        });
        response.updatedAt = new Date();
        return response;
      } catch {
        throw new InternalServerErrorException(
          'Failed to add product categories',
        );
      }
    } else if (data.op === OperationType.REMOVE) {
      try {
        await this.prismaService.productCategory.deleteMany({
          where: {
            product_id: data.id,
            category_id: { in: data.categories },
          },
        });
        response.updatedAt = new Date();
        return response;
      } catch {
        throw new InternalServerErrorException(
          'Failed to remove product categories',
        );
      }
    }
  }

  async removeProductImages(publicId: string): Promise<{ result: string }> {
    const response = await this.cloudinaryService.uploader.destroy(publicId);

    if (response.result !== 'ok') {
      throw new InternalServerErrorException(
        `Failed to delete file: ${response.result}`,
      );
    }

    await this.prismaService.productImages.delete({
      where: { public_id: publicId },
    });

    return { result: response.result };
  }

  async removeProduct(id: string): Promise<Product> {
    await this.findProductById(id);
    return this.prismaService.product.delete({
      where: { id },
    });
  }
}
