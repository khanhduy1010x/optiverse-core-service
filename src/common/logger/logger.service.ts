import { Injectable } from '@nestjs/common';
import { createLogger, transports, format, Logger } from 'winston';

@Injectable()
export class LoggerService {
  private static logger: Logger;
  static getLogger(): Logger {
    if (!LoggerService.logger) {
      LoggerService.logger = createLogger({
        level: 'info',
        format: format.combine(
          format.timestamp(),
          format.colorize(),
          format.printf((info) => {
            const formattedTime = new Date(info.timestamp as Date).toLocaleTimeString('en-GB', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              fractionalSecondDigits: 3,
            });

            return `${formattedTime} ${info.level}: ${info.message}`;
          }),
        ),
        transports: [
          new transports.Console({
            level: 'info',
          }),
        ],
      });
    }
    return LoggerService.logger;
  }

  static logAppStartup(): void {
    const logger = LoggerService.getLogger();
    logger.info('Application has started.');
  }
}
