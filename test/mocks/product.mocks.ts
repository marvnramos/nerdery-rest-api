import { Product } from '@prisma/client';

export class ProductServiceMocks {
  static product: Product = {
    id: 'ff7aade2-3920-48ce-b419-8385b324f25c',
    product_name: 'Product',
    description: 'Product description',
    unit_price: 100,
    is_available: true,
    stock: 10,
    created_at: new Date(),
    updated_at: new Date(),
  };

  static productWithLowStock: Product = {
    id: 'prod123',
    product_name: 'Low Stock Product',
    description: 'Product with insufficient stock',
    unit_price: 50,
    is_available: true,
    stock: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };
}
