import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product, ProductImages } from '@prisma/client';
import { PrismaService } from '../utils/prisma/prisma.service';
import { AddProductArgs } from './dto/args/add.product.args';
import { ConfigOptions, v2 as CloudinaryV2 } from 'cloudinary';
import * as streamHelper from 'streamifier';
import { UpdateProductArgs } from './dto/args/update.product.args';
import { decodeBase64, encodeBase64, filterNullEntries } from '../utils/tools';
import { UpdateProductCategoriesArgs } from './dto/args/update.product.categories.args';
import { OperationType } from '../utils/enums/operation.enum';
import { UpdateProductRes } from './dto/responses/update.product.images.res';
import { GetProductsArgs } from './dto/args/get.products.args';
import { plainToInstance } from 'class-transformer';
import { Categories } from '../categories/models/categories.model';
import { PaginatedProductsType } from './dto/responses/products.pagination.type.res';
import { ProductImagesType } from './types/product.images.type';
import { ProductType } from './types/product.type';
import { UpdateProductImagesArgs } from './dto/args/update.product.images.args';

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

  async validateProductExists(id: string): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!product)
      throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  private async uploadToCloudinary(image: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryService.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => (error ? reject(error) : resolve(result)),
      );
      streamHelper.createReadStream(image.buffer).pipe(uploadStream);
    });
  }

  async createProduct(data: AddProductArgs): Promise<Product> {
    const { categories, ...productData } = data;
    const product = await this.prismaService.product.create({
      data: {
        ...productData,
        product_name: data.productName,
        unit_price: data.unitPrice,
      },
    });
    await this.createProductCategories(categories, product.id);
    return product;
  }

  async getProductById(id: string): Promise<ProductType> {
    const product = await this.findProductById(id);
    return plainToInstance(ProductType, product);
  }

  async createProductCategories(
    categories: number[],
    productId: string,
  ): Promise<void> {
    if (!categories?.length) return;
    await this.prismaService.productCategory.createMany({
      data: categories.map((categoryId) => ({
        category_id: categoryId,
        product_id: productId,
      })),
      skipDuplicates: true,
    });
  }

  async editProductData(id: string, data: UpdateProductArgs): Promise<Product> {
    await this.findProductById(id);

    if (data.stock === 0) data.isAvailable = false;
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

  async updateProductImages(
    productId: string,
    uploadedImages: Express.Multer.File[],
    updateImagesDto: UpdateProductImagesArgs,
  ): Promise<void> {
    this.validateUpdateImagesRequest(updateImagesDto, uploadedImages);

    if (updateImagesDto.op === 'add') {
      for (const uploadedImage of uploadedImages) {
        await this.uploadImage(uploadedImage, productId);
      }
    } else if (updateImagesDto.op === 'remove') {
      for (const publicImageId of updateImagesDto.publicImageId) {
        await this.removeProductImages(publicImageId);
      }
    }
  }

  async uploadImage(
    image: Express.Multer.File,
    productId: string,
  ): Promise<ProductImages> {
    await this.validateProductExists(productId);
    const uploadResult = await this.uploadToCloudinary(image);
    const imageData: Prisma.ProductImagesCreateInput = {
      image_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      product: { connect: { id: productId } },
    };
    return this.addProductImage(imageData);
  }

  async addProductImage(
    data: Prisma.ProductImagesCreateInput,
  ): Promise<ProductImages> {
    await this.validateProductExists(data.product.connect?.id);
    return this.prismaService.productImages.create({ data });
  }

  async getPaginatedProducts(
    args: GetProductsArgs,
  ): Promise<PaginatedProductsType> {
    const products = await this.fetchPaginatedProducts(args);
    return plainToInstance(PaginatedProductsType, products);
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!product)
      throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
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

  private async fetchPaginatedProducts(args: GetProductsArgs) {
    const cursorId = args.after ? decodeBase64(args.after) : null;

    const where: Prisma.ProductWhereInput = {
      AND: [
        args.categoriesIds?.length
          ? {
              categories: { some: { category_id: { in: args.categoriesIds } } },
            }
          : {},
      ],
    };

    const products = await this.prismaService.product.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        categories: true,
        images: true,
      },
      take: args.first || 10,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
    });

    const totalCount = await this.prismaService.product.count({ where });

    const lastProduct = products[products.length - 1];
    const endCursor = lastProduct ? encodeBase64(lastProduct.id) : null;

    return {
      edges: products.map((product) => ({
        node: product,
        cursor: encodeBase64(product.id),
      })),
      pageInfo: {
        endCursor,
        hasNextPage: products.length === (args.first || 10),
      },
      totalCount,
    };
  }

  async getProductImages(productId: string): Promise<ProductImagesType[]> {
    const productImages = await this.prismaService.productImages.findMany({
      where: { product_id: productId },
    });

    return productImages.map((productImage) => {
      return plainToInstance(ProductImagesType, productImage);
    });
  }

  async updateProductCategories(
    data: UpdateProductCategoriesArgs,
  ): Promise<UpdateProductRes> {
    await this.validateProductExists(data.id);
    const update = new UpdateProductRes();
    const categoryData = data.categories.map((categoryId) => ({
      product_id: data.id,
      category_id: categoryId,
    }));

    if (data.op === OperationType.ADD) {
      await this.prismaService.productCategory.createMany({
        data: categoryData,
        skipDuplicates: true,
      });
    } else if (data.op === OperationType.REMOVE) {
      await this.prismaService.productCategory.deleteMany({
        where: { product_id: data.id, category_id: { in: data.categories } },
      });
    }
    update.updatedAt = new Date();
    return update;
  }

  async removeProduct(id: string): Promise<void> {
    await this.validateProductExists(id);

    const productImages = await this.prismaService.productImages.findMany({
      where: { product_id: id },
      select: { public_id: true },
    });

    if (productImages.length > 0) {
      await Promise.all(
        productImages.map(({ public_id }) =>
          this.removeProductImages(public_id),
        ),
      );
    }

    await this.prismaService.product.delete({ where: { id } });
  }

  async getProductCategories(productId: string): Promise<Categories[]> {
    const productCategories = await this.prismaService.productCategory.findMany(
      {
        where: { product_id: productId },
        include: { category: true },
      },
    );
    return productCategories.map((relation) => {
      return plainToInstance(Categories, relation.category);
    });
  }

  async removeProductImages(publicId: string): Promise<{ result: string }> {
    const response = await this.cloudinaryService.uploader.destroy(publicId);
    if (response.result !== 'ok')
      throw new InternalServerErrorException(
        `Failed to delete file: ${response.result}`,
      );
    await this.prismaService.productImages.delete({
      where: { public_id: publicId },
    });
    return { result: response.result };
  }

  async getProductUnitPrice(productId: string): Promise<number> {
    const product = await this.validateProductExists(productId);
    return product.unit_price;
  }
}
