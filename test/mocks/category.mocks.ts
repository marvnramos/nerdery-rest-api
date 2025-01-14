import { faker } from '@faker-js/faker/locale/ar';

export class CategoryServiceMocks {
  static createMockCategory() {
    return {
      id: faker.number.int({ min: 1 }),
      category_name: faker.commerce.productAdjective(),
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  static currentDate = new Date();

  // static category = this.createMockCategory();

  // static anotherCategory = this.createMockCategory({
  //   id: 2,
  //   category_name: 'Home Appliances',
  // });

  // static allCategories = [this.category, this.anotherCategory];

  static categories = [this.createMockCategory(), this.createMockCategory()];

  static createCategoryRes = {
    id: 1,
    created_at: this.currentDate,
  };

  static categoryInUse = { categoryId: 1 };

  static deletedCategory = { deletedAt: this.currentDate };
}
