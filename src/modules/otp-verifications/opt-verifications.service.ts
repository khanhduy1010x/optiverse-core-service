import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OtpType } from './otp-verifications.schema';
import { OtpVerificationRepository } from './otp-verifications.repository';
import { AppException } from 'src/common/exceptions/app.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';

@Injectable()
export class OtpVerificationService {
  
}
