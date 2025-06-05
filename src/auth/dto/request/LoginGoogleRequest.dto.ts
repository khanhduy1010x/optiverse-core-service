import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginGoogleRequest {
  @ApiProperty({ example: 'ya29.a0AR...', description: 'Google OAuth Code' })
  @IsNotEmpty({ message: 'Google code is not empty' })
  token: string;

  is_web?: boolean;
}
