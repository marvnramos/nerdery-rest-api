import { UserRole } from '@prisma/client';

export class AuthServiceMocks {
  static user = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    first_name: 'John',
    last_name: 'Doe',
    is_email_verified: true,
    role_id: 1,
    address: '123 Test Street',
    created_at: new Date(),
    updated_at: new Date(),
  };

  static userRole: UserRole = {
    id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    role: 'CLIENT',
  };

  static accessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
}
