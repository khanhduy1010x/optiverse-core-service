import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordRequest {
  @ApiProperty({
    example: 'SecurePass123!',
    description: 'New password (must be at least 6 characters)',
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'New password less than 6 character' })
  newPassword: string;
}
