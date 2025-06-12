import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordRequest {
  @ApiProperty({ example: 'OldPassword123!', description: 'Current password of the user' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePassword456!', description: 'New password (must be secure)' })
  @IsString()
  newPassword: string;
}
