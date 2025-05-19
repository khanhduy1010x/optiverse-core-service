import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginResponse {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The access token for authentication',
  })
  @IsNotEmpty({ message: 'Access token cannot be empty' })
  access_token: string;

  @ApiProperty({
    example: 'dGhpc2lzdGhlcmVmcmVzaHRva2Vu...',
    description: 'The refresh token used to obtain a new access token',
  })
  @IsNotEmpty({ message: 'Refresh token cannot be empty' })
  refresh_token: string;
}
