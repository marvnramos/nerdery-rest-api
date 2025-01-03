export class CategoryServiceMocks {
  static currentDate = new Date();
  static category = {
    id: 1,
    categoryName: 'Electronics',
    createdAt: CategoryServiceMocks.currentDate,
    updatedAt: CategoryServiceMocks.currentDate,
  };

  static createCategoryRes = {
    id: '1',
    createdAt: CategoryServiceMocks.currentDate,
  };

  static anotherCategory = {
    id: 2,
    categoryName: 'Home Appliances',
    createdAt: CategoryServiceMocks.currentDate,
    updatedAt: CategoryServiceMocks.currentDate,
  };

  static allCategories = [
    {
      id: 1,
      categoryName: 'Electronics',
      createdAt: CategoryServiceMocks.currentDate,
      updatedAt: CategoryServiceMocks.currentDate,
    },
    {
      id: 2,
      categoryName: 'Home Appliances',
      createdAt: CategoryServiceMocks.currentDate,
      updatedAt: CategoryServiceMocks.currentDate,
    },
  ];

  static categoryInUse = {
    categoryId: 1,
  };

  static deletedCategory = {
    deletedAt: CategoryServiceMocks.currentDate,
  };
}
