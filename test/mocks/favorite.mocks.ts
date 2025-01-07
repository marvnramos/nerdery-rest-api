export class FavoriteServiceMocks {
  static currentDate = new Date();

  /**
   * Creates a mock favorite with default values and optional overrides.
   * @param userId - ID of the user who added the favorite.
   * @param productId - ID of the product added as favorite.
   * @param overrides - Optional overrides for default fields.
   * @returns A mock favorite object.
   */
  static newFavorite = (
    userId: string,
    productId: string,
    overrides: Partial<{ id: string; created_at: Date; updated_at: Date }> = {},
  ) => {
    return {
      id: overrides.id || 'favorite123',
      user_id: userId,
      product_id: productId,
      created_at: overrides.created_at || this.currentDate,
      updated_at: overrides.updated_at || this.currentDate,
    };
  };

  static existingFavorite = FavoriteServiceMocks.newFavorite(
    'user123',
    'product123',
  );

  static userFavorites = [
    {
      id: 'favorite1',
      user_id: 'user123',
      product_id: 'product1',
      product: {
        id: 'product1',
        productName: 'Product 1',
        description: 'Sample product 1',
        stock: 10,
        isAvailable: true,
        unitPrice: 100,
        categories: [],
        images: [],
        created_at: this.currentDate,
        updated_at: this.currentDate,
      },
      created_at: this.currentDate,
      updated_at: this.currentDate,
    },
  ];
}
