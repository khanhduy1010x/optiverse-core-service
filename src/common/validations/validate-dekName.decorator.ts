import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-code.enum';

@ValidatorConstraint({ async: false })
export class IsValidNicknameConstraint implements ValidatorConstraintInterface {
  private errorCode: ErrorCode;

  constructor(errorCode: ErrorCode) {
    this.errorCode = errorCode;
  }

  validate(deckName: string) {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!regex.test(deckName)) {
      throw new AppException(this.errorCode);
    }
    return true;
  }

  defaultMessage() {
    return 'Nickname must be between 3 to 20 characters and can only contain letters, numbers, and underscores (_).';
  }
}

export function IsValidNickname(errorCode: ErrorCode, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [errorCode],
      validator: new IsValidNicknameConstraint(errorCode),
    });
  };
}
