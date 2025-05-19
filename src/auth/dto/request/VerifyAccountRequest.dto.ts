import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsBoolean } from 'class-validator';

export class VerifyAccountRequest {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email associated with the account',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({ example: '123456', description: 'The OTP (One-Time Password) sent to the email' })
  @IsNotEmpty({ message: 'OTP cannot be empty' })
  otp: string;

  @ApiProperty({
    example: true,
    description:
      'Flag indicating whether the request is for account verification (true) or password reset (false)',
  })
  @IsBoolean({ message: 'isVerify must be a boolean value' })
  isVerify: boolean;
}
