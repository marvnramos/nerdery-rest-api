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
}
