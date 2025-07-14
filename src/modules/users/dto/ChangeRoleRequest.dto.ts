import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.schema';

export class ChangeRoleRequest {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
