import { IsOptional, IsString } from 'class-validator';

export class UpdateAvatarRequest {
  name?: string;

  color?: string;
}
