export class CategoryServiceMocks {
  static category = {
    id: "1",
    categoryName: 'Electronics',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  static createCategoryRes = {
    id: '1',
    createdAt: new Date(),
  };

  static anotherCategory = {
    id: 2,
    categoryName: 'Home Appliances',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  static allCategories = [
    {
      id: 1,
      categoryName: 'Electronics',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      categoryName: 'Home Appliances',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  static categoryInUse = {
    categoryId: 1,
  };

  static deletedCategory = {
    deletedAt: new Date(),
  };
}
