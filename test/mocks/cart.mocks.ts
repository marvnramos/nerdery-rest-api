import { Cart, CartItem } from '@prisma/client';
import { UpdateProductCartRes } from '../../src/carts/dto/response/update.product.cart.res';

export class CartServiceMocks {
  static cart: Cart = {
    id: '49c84175-021f-4603-a1b4-836f1f287dea',
    user_id: 'c087cc65-32e2-405b-9c11-ccf413843724',
    created_at: new Date(),
    updated_at: new Date(),
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

  static newCart: Cart = {
    id: 'newCart123',
    user_id: 'user123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  static newCartItem: CartItem = {
    id: 'item123',
    quantity: 2,
    cart_id: 'newCart123',
    product_id: 'prod123',
    created_at: new Date(),
    updated_at: new Date(),
  };
}
