export class CategoryServiceMocks {
  static createMockCategory(
    overrides: Partial<{
      id: number;
      category_name: string;
      created_at: Date;
      updated_at: Date;
    }> = {},
  ) {
    return {
      id: overrides.id ?? 1,
      category_name: overrides.category_name ?? 'Electronics',
      created_at: overrides.created_at ?? this.currentDate,
      updated_at: overrides.updated_at ?? this.currentDate,
    };
  }

  static currentDate = new Date();

  static category = this.createMockCategory();

  static anotherCategory = this.createMockCategory({
    id: 2,
    category_name: 'Home Appliances',
  });

  static allCategories = [this.category, this.anotherCategory];

  static createCategoryRes = {
    id: 1,
    created_at: this.currentDate,
  };

  static categoryInUse = { categoryId: 1 };

  static deletedCategory = { deletedAt: this.currentDate };
}
