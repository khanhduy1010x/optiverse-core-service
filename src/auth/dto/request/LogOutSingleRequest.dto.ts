import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LogOutSingleReques {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', description: 'Session ID to log out' })
  @IsNotEmpty({ message: 'Session ID not empty' })
  session_id: string;
}
