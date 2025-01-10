import { UserRole, UserRoleType } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/ar';

export class AuthServiceMocks {
  static service = {};

  static user = {
    id: faker.string.uuid(),
    email: faker.internet.exampleEmail({ firstName: 'test' }),
    password: faker.internet.password(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    is_email_verified: true,
    role_id: 1,
    address: faker.location.streetAddress(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  static userRole: UserRole = {
    id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    role: UserRoleType.CLIENT,
  };

  static access_token = faker.internet.jwt();
}
