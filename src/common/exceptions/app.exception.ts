import { HttpException } from '@nestjs/common';
import { ErrorCode, ErrorDetails } from './error-code.enum';

export class AppException extends HttpException {
  private errorCode: ErrorCode;

  constructor(errorCode: ErrorCode) {
    const { message, httpStatus, code } =
      ErrorDetails[errorCode] || ErrorDetails[ErrorCode.UNCATEGORIZED_CODE];

    super({ code, message }, httpStatus);
    this.errorCode = code;
  }
}
