import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileRequest {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false
  })
  @IsString()
  @IsOptional()
  full_name?: string;
}
