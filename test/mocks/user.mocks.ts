import { faker } from '@faker-js/faker/locale/ar';
import { UserRoleType } from '@prisma/client';
import { getExpirationTimestamp } from '../../utils/time.util';

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

  static email = faker.internet.exampleEmail({ firstName: 'test' });

  static createUserMock = {
    id: faker.string.uuid(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.exampleEmail({ firstName: 'test' }),
    address: faker.location.streetAddress(),
    password: faker.internet.password(),
    is_email_verified: true,
    role_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  static userManagerRole = {
    id: 1,
    role: UserRoleType.MANAGER,
  };

  static uuid = faker.string.uuid();

  static createToken = (userId: string, tokenTypeId?: number) => ({
    id: faker.string.uuid(),
    token: faker.string.uuid(),
    user_id: userId,
    token_type_id: tokenTypeId || 2,
    is_used: false,
    expired_at: getExpirationTimestamp(),
    created_at: new Date(),
    updated_at: new Date(),
  });
}
