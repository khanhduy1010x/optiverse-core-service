import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HashPasswordService {
  private readonly saltOrRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltOrRounds);
  }
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
