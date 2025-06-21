import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateAccountRequest {
  @ApiProperty({
    example: 'user@example.com',
    description: "The user's email address (must be valid)",
  })
  // @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'The full name of the user' })
  @IsNotEmpty({ message: 'Full name cannot be empty' })
  full_name: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Password with a minimum length of 6 characters',
  })
  // @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
