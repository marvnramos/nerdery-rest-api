import { Cart, CartItem } from '@prisma/client';
import { UpdateProductCartRes } from '../../src/carts/dto/response/update.product.cart.res';

export class CartServiceMocks {
  static cart: Cart = {
    id: '49c84175-021f-4603-a1b4-836f1f287dea',
    user_id: 'c087cc65-32e2-405b-9c11-ccf413843724',
    created_at: new Date(),
    updated_at: new Date(),
  };

  static notAcceptableExceptionCart: Cart = {
    id: 'cart123',
    user_id: 'anotherUser',
    created_at: new Date(),
    updated_at: new Date(),
  };

  static cartItemToGetCartById = [
    {
      id: 'item123',
      cart_id: '49c84175-021f-4603-a1b4-836f1f287dea',
      product_id: 'prod123',
      quantity: 2,
      created_at: new Date(),
      updated_at: new Date(),
      product: {
        id: 'prod123',
        product_name: 'Sample Product',
        description: 'Test description',
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

  static cartToGetCartByUserId = (userId: string) => {
    return {
      id: 'cart123',
      user_id: userId,
      cart_items: [
        {
          id: 'item123',
          product_id: 'prod123',
          quantity: 2,
          created_at: new Date(),
          updated_at: new Date(),
          product: {
            id: 'prod123',
            product_name: 'Sample Product',
            description: 'Test description',
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

  static cartFromDeleteProductFromCart: Cart = {
    id: 'cart123',
    user_id: 'user123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  static cartItemToDelete: CartItem = {
    id: 'item123',
    created_at: new Date(),
    updated_at: new Date(),
    cart_id: 'cart123',
    product_id: 'prod123',
    quantity: 1,
  };

  static newUpsertCartItem = (
    cartId: string,
    productId: string,
    quantity: number,
  ) => {
    return {
      id: 'newCartItem456',
      cart_id: cartId,
      product_id: productId,
      quantity,
      created_at: new Date(),
      updated_at: new Date(),
    };
  };

  static cartItem: CartItem = {
    id: '49c84175-021f-4603-a1b4-836f1f287dea',
    quantity: 1,
    cart_id: '49c84175-021f-4603-a1b4-836f1f287dea',
    product_id: 'ff7aade2-3920-48ce-b419-8385b324f25c',
    created_at: new Date(),
    updated_at: new Date(),
  };

  static updatedCartItem: UpdateProductCartRes = {
    updatedAt: new Date(),
  };
}
