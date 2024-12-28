import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product, ProductImages } from '@prisma/client';
import { PrismaService } from 'src/utils/prisma/prisma.service';
import { AddProductArgs } from './dto/args/add.product.args';
import { ConfigOptions, v2 as CloudinaryV2 } from 'cloudinary';
import * as streamHelper from 'streamifier';
import { UpdateProductArgs } from './dto/requests/update.product.args';
import { decodeBase64, encodeBase64, filterNullEntries } from '../utils/tools';
import { UpdateProductCategoriesArgs } from './dto/requests/update.product.categories.args';
import { OperationType } from '../utils/enums/operation.enum';
import { UpdateProductRes } from './dto/responses/update.product.images.res';
import { Product as ProductModel } from './models/products.model';
import { GetProductsRes } from './dto/responses/get.products.res';
import { GetProductsArgs } from './dto/args/get.products.args';
import { plainToInstance } from 'class-transformer';
import { Categories } from 'src/categories/models/categories.model';
import { ProductImages as ProductImagesModel } from './models/product.images.model';

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

  async createProduct(data: AddProductArgs): Promise<Product> {
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

  async editProductData(id: string, data: UpdateProductArgs): Promise<Product> {
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
    await this.findProductById(productId);

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
  }

  async addProductImage(
    data: Prisma.ProductImagesCreateInput,
  ): Promise<ProductImages> {
    const productId = data.product.connect?.id;

    await this.findProductById(productId);

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

  async getProducts(data: GetProductsArgs): Promise<GetProductsRes> {
    const query: any = {};
    let products: Product[] = [];
    let totalCount = 0;
    const response = new GetProductsRes();

    const { first, after, categoriesIds } = data;

    if (after) {
      const decodedCursor = decodeBase64(after);
      const recordExists = await this.prismaService.product.findUnique({
        where: { id: decodedCursor },
      });

      if (!recordExists) {
        throw new BadRequestException(
          `Invalid cursor: No record found for cursor ${after}`,
        );
      }

      query.id = decodedCursor;
    }

    if (categoriesIds?.length) {
      const productCategories =
        await this.prismaService.productCategory.findMany({
          where: { category_id: { in: categoriesIds } },
          select: { product_id: true },
        });

      const productIds = productCategories.map(
        (category) => category.product_id,
      );
      totalCount = productIds.length;
      products = await this.prismaService.product.findMany({
        where: {
          AND: [
            { id: { in: productIds } },
            after ? { id: { gt: query.id } } : {},
          ],
        },
        take: first,
        orderBy: { id: 'asc' },
        include: {
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  category_name: true,
                  created_at: true,
                  updated_at: true,
                },
              },
            },
          },
          images: {
            select: {
              id: true,
              image_url: true,
              public_id: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      });
    } else {
      totalCount = await this.prismaService.product.count();

      products = await this.prismaService.product.findMany({
        where: {},
        skip: after ? 1 : 0,
        cursor: after ? { id: query.id } : undefined,
        take: first,
        orderBy: { id: 'asc' },
        include: {
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  category_name: true,
                  created_at: true,
                  updated_at: true,
                },
              },
            },
          },
          images: {
            select: {
              id: true,
              image_url: true,
              public_id: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      });
    }

    response.edges = products.map((product) => ({
      node: plainToInstance(ProductModel, product),
      cursor: encodeBase64(product.id),
    }));

    response.nodes = plainToInstance(ProductModel, products);
    response.pageInfo = {
      startCursor: products.length > 0 ? encodeBase64(products[0].id) : null,
      endCursor:
        products.length > 0
          ? encodeBase64(products[products.length - 1].id)
          : null,
      hasNextPage: totalCount > (after ? 1 : 0) + first,
      hasPreviousPage: !!after,
    };

    response.totalCount = totalCount;

    return response;
  }

  async getProductCategories(productId: string): Promise<Categories[]> {
    const productCategories = await this.prismaService.productCategory.findMany(
      {
        where: { product_id: productId },
        include: {
          category: true,
        },
      },
    );

    return productCategories.map((relation) => ({
      id: relation.category.id,
      categoryName: relation.category.category_name,
      createdAt: relation.category.created_at,
      updatedAt: relation.category.updated_at,
    }));
  }

  async getProductsFilteredByIds(
    productsId?: string[],
  ): Promise<ProductModel[]> {
    const products = await this.prismaService.product.findMany({
      where:
        productsId && productsId.length > 0 ? { id: { in: productsId } } : {},
      include: {
        categories: {
          select: {
            category: {
              select: {
                id: true,
                category_name: true,
                created_at: true,
                updated_at: true,
              },
            },
          },
        },
        images: {
          select: {
            id: true,
            image_url: true,
            public_id: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    return products.map((product) => {
      const productModel = new ProductModel();
      productModel.id = product.id;
      productModel.productName = product.product_name;
      productModel.description = product.description;
      productModel.stock = product.stock;
      productModel.isAvailable = product.is_available;
      productModel.unitPrice = product.unit_price;
      productModel.createdAt = product.created_at;
      productModel.updatedAt = product.updated_at;
      return productModel;
    });
  }

  async getProductById(id: string): Promise<ProductModel> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            category: {
              select: {
                id: true,
                category_name: true,
                created_at: true,
                updated_at: true,
              },
            },
          },
        },
        images: {
          select: {
            id: true,
            image_url: true,
            public_id: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Failed to find product');
    }

    const productModel = new ProductModel();
    productModel.id = product.id;
    productModel.productName = product.product_name;
    productModel.description = product.description;
    productModel.stock = product.stock;
    productModel.isAvailable = product.is_available;
    productModel.unitPrice = product.unit_price;
    productModel.createdAt = product.created_at;
    productModel.updatedAt = product.updated_at;

    return productModel;
  }

  async getProductImages(productId: string): Promise<ProductImagesModel[]> {
    const productImages = await this.prismaService.productImages.findMany({
      where: {
        product_id: productId,
      },
    });

    return productImages.map((productImage) => ({
      id: productImage.id,
      productId: productImage.product_id,
      imageUrl: productImage.image_url,
      publicId: productImage.public_id,
      createdAt: productImage.created_at,
      updatedAt: productImage.updated_at,
    }));
  }

  async updateProductCategories(
    data: UpdateProductCategoriesArgs,
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
