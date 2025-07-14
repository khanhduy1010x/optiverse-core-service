import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../modules/users/user.schema';

export class JwtPayload {
  @ApiProperty({
    example: '60d21b4667d0d8992e610c85',
    description: 'Unique identifier of the user',
  })
  user_id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  full_name: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6g7h8i9j0',
    description: 'Session ID associated with the login session',
  })
  session_id: string;

  @ApiProperty({
    example: 'user',
    description: 'Role of the user',
    enum: UserRole,
  })
  role: UserRole;

  constructor(
    user_id: string,
    email: string,
    full_name: string,
    session_id: string,
    role: UserRole = UserRole.USER,
  ) {
    this.user_id = user_id;
    this.email = email;
    this.full_name = full_name;
    this.session_id = session_id;
    this.role = role;
  }
}
