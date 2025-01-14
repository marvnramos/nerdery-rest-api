import { faker } from '@faker-js/faker/locale/ar';

export class CartServiceMocks {
  static createCart = (userId: string) => ({
    id: faker.string.uuid(),
    user_id: userId,
    created_at: new Date(),
    updated_at: new Date(),
  });

  static createCartItem = (
    cartId: string,
    productId: string,
    quantity: number,
  ) => ({
    id: faker.string.uuid(),
    cart_id: cartId,
    product_id: productId,
    quantity,
    created_at: new Date(),
    updated_at: new Date(),
  });

  static cartItemToGetCartById = () => {
    const productId = faker.string.uuid();
    return [
      {
        id: faker.string.uuid(),
        cart_id: faker.string.uuid(),
        product_id: productId,
        quantity: 2,
        created_at: new Date(),
        updated_at: new Date(),
        product: {
          id: productId,
          product_name: faker.commerce.product(),
          description: faker.commerce.productDescription(),
          stock: 10,
          is_available: true,
          unit_price: 100,
          categories: [],
          images: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      },
    ];
  };

  static cartToGetCartByUserId = (userId: string) => {
    const productId = faker.string.uuid();
    return {
      id: faker.string.uuid(),
      user_id: userId,
      cart_items: [
        {
          id: faker.string.uuid(),
          product_id: productId,
          quantity: 2,
          created_at: new Date(),
          updated_at: new Date(),
          product: {
            id: productId,
            product_name: faker.commerce.product(),
            description: faker.commerce.productDescription(),
            stock: 10,
            is_available: true,
            unit_price: 100,
            categories: [],
            images: [],
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ],
      created_at: new Date(),
      updated_at: new Date(),
    };
  };
}
