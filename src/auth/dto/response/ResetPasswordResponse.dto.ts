import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponse {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The reset token used for password reset',
  })
  reset_token: string;
}
