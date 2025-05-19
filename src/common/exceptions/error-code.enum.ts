import { HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  INVALID_CODE,
  UNCATEGORIZED_CODE,
  INVALID_USERNAME,
  NULL_USERNAME,
  NULL_PASSWORD,
  INVALID_PASSWORD,
  UNAUTHENTICATED,
  UNAUTHORIZED,
  NOT_FOUND,
  SERVER_ERROR,
  INVALID_DECKNAME,
  MISSING_SECRET_KEY,
  EMAIL_EXISTS,
  VERIFY_TIME_OUT,
  INVALID_OTP,
  WATTING_TIME_OTP,
  ACCOUNT_NOT_VERIFIED,
  EMAIL_EXISTS_NOT_VERIFY,
  CURRENT_PASSWORD_NOT_MATCH,
  INVALID_TOKEN_GOOGLE,
  ACCOUNT_IS_LOGOUT,
  MISSING_ACCESS_TOKEN,
}
export const ErrorDetails = {
  [ErrorCode.INVALID_CODE]: {
    code: 1000,
    message: 'Invalid code',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.UNCATEGORIZED_CODE]: {
    code: 9999,
    message: 'Uncategorized error',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.INVALID_USERNAME]: {
    code: 1001,
    message: 'Username must be between 6 - 25 characters',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.NULL_USERNAME]: {
    code: 1002,
    message: 'Username must not be null',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.NULL_PASSWORD]: {
    code: 1003,
    message: 'Password must not be null',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.INVALID_PASSWORD]: {
    code: 1004,
    message:
      'Password must have at least 8 characters with uppercase, lowercase, number, and special character',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.UNAUTHENTICATED]: {
    code: 1005,
    message: 'Unauthenticated',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.UNAUTHORIZED]: {
    code: 1006,
    message: 'You do not have permission',
    httpStatus: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.NOT_FOUND]: {
    code: 1007,
    message: 'Resource not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.SERVER_ERROR]: {
    code: 1008,
    message: 'Internal server error',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.INVALID_DECKNAME]: {
    code: 1009,
    message: 'Invalid DeckName',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.MISSING_SECRET_KEY]: {
    code: 1010,
    message: 'Missing JWT_SECRET in environment variables',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.EMAIL_EXISTS]: {
    code: 1011,
    message: 'Email exists & verified',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.VERIFY_TIME_OUT]: {
    code: 1012,
    message: 'Email verify is time out',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.INVALID_OTP]: {
    code: 1013,
    message: 'Invalid OTP',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.WATTING_TIME_OTP]: {
    code: 1014,
    message: 'Watting for next send OTP',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.ACCOUNT_NOT_VERIFIED]: {
    code: 1015,
    message: 'Account is unverify',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.EMAIL_EXISTS_NOT_VERIFY]: {
    code: 1016,
    message: 'Email is exits but not verify',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.CURRENT_PASSWORD_NOT_MATCH]: {
    code: 1017,
    message: 'Current password not match',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.INVALID_TOKEN_GOOGLE]: {
    code: 1018,
    message: 'Invalid token google',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.ACCOUNT_IS_LOGOUT]: {
    code: 1019,
    message: 'Account is log out',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.MISSING_ACCESS_TOKEN]: {
    code: 1020,
    message: 'Missing access token',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
};
