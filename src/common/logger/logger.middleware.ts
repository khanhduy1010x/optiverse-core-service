import { Injectable, NestMiddleware } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const logger = LoggerService.getLogger();

    logger.info(`-- Incoming Request --`);
    logger.info(`Method: ${req.method}`);
    logger.info(`URL: ${req.originalUrl}`);
    logger.info(`-------------------------`);

    res.on('finish', () => {
      logger.info(`-- Response Sent --`);
      logger.info(`Status Code: ${res.statusCode}`);
      logger.info(`=========================\n \n `);
    });

    next();
  }
}
