import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product, ProductImages } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';
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
import { Categories } from 'src/categories/models/categories.model';
import { PaginatedProductsType } from './dto/responses/products.pagination.type.res';
import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { ProductImagesType } from './types/product.images.type';

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

  private async validateProductExists(id: string): Promise<Product> {
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

  private async fetchPaginatedProducts(args: GetProductsArgs) {
    const productIds = args.categoriesIds?.length
      ? await this.getProductIdsByCategories(args.categoriesIds)
      : [];
    const cursorId = args.after ? decodeBase64(args.after) : null;

    const where = {
      AND: [
        productIds.length ? { id: { in: productIds } } : {},
        cursorId ? { id: { gt: cursorId } } : {},
      ],
    };

    return findManyCursorConnection(
      (findArgs) =>
        this.prismaService.product.findMany({
          where,
          orderBy: { id: 'asc' },
          include: { categories: true, images: true },
          ...findArgs,
        }),
      () => this.prismaService.product.count(),
      args,
      { getCursor: (product) => ({ id: encodeBase64(product.id) }) },
    );
  }

  private async getProductIdsByCategories(
    categoryIds: number[],
  ): Promise<string[]> {
    const productCategories = await this.prismaService.productCategory.findMany(
      {
        where: { category_id: { in: categoryIds } },
        select: { product_id: true },
      },
    );
    return productCategories.map((relation) => relation.product_id);
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
    return productCategories.map((relation) => ({
      id: relation.category.id,
      categoryName: relation.category.category_name,
      createdAt: relation.category.created_at,
      updatedAt: relation.category.updated_at,
    }));
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
