export class UserServiceMocks {
  static user = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'test@example.com',
    address: '123 Main St',
    password: 'password123',
    is_email_verified: false,
  };
  static userCreate = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'test@example.com',
    address: '123 Main St',
    password: expect.any(String),
    is_email_verified: false,
  };

  static userFail = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'test@example.com',
    address: '123 Main St',
    password: 'password123',
    is_email_verified: false,
  };

  static userFindByEmail = {
    id: 'user123',
    email: 'test@example.com',
  };
}
