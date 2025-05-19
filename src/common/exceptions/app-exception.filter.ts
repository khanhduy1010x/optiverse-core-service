import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const responseBody = exception.getResponse();
    const message = Array.isArray(responseBody) ? responseBody[0] : responseBody;

    response.status(message.statusCode).json({
      code: message.code,
      message: message.message,
    });
  }
}
