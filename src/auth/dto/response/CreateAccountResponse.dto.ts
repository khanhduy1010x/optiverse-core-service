import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountResponse {
  @ApiProperty({ example: 'user@example.com', description: 'The registered email address' })
  email: string;

  @ApiProperty({
    example: '60d21b4667d0d8992e610c85',
    description: 'Unique identifier for the created user',
  })
  user_id: string;

  @ApiProperty({ example: false, description: 'Indicates whether the account has been verified' })
  verify: boolean;
}
