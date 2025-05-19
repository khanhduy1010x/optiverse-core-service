import { Injectable } from '@nestjs/common';
import { join } from 'path';

@Injectable()
export class AppService {
  getIndex(res: any): void {
    const filePath = join(__dirname, '../public/');

    res.sendFile(filePath);
  }
}
