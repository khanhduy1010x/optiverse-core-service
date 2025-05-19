import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'winston';
import { LoggerService } from '../logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger: Logger;

  constructor() {
    this.logger = LoggerService.getLogger();
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'object' && 'httpStatus' in exceptionResponse) {
      delete exceptionResponse['httpStatus'];
    }
    this.logger.error(`Exception occurred: ${JSON.stringify(exceptionResponse)}`);

    response.status(status).json(exceptionResponse);
  }
}
