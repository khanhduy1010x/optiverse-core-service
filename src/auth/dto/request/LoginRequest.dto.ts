import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginRequest {
  @ApiProperty({ example: 'test123@gmail.com', description: 'User email address' })
  @IsEmail({}, { message: 'Email invalid' })
  email: string;

  @ApiProperty({ example: 'testing123', description: 'User password' })
  @IsNotEmpty({ message: 'Password not empty' })
  password: string;

  @ApiProperty({ example: 'iPhone 14 - iOS 16.3', description: 'Device information' })
  @IsNotEmpty({ message: 'Device info not empty' })
  device_info: string;
}
