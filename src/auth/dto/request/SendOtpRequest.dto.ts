import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsBoolean } from 'class-validator';

export class SendOtpRequest {
  @ApiProperty({ example: 'user@example.com', description: 'User email to receive OTP' })
  @IsEmail({}, { message: 'Email invalid' })
  email: string;

  @ApiProperty({
    example: true,
    description:
      'Flag to determine verification type (true for email verification, false for password reset)',
  })
  @IsBoolean({ message: 'isVerify is type boolean' })
  isVerify: boolean;
}
