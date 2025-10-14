import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OtpType } from './otp-verifications.schema';
import { OtpVerificationRepository } from './otp-verifications.repository';
import { AppException } from 'src/common/exceptions/app.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';

@Injectable()
export class OtpVerificationService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly otpVerificationRepository: OtpVerificationRepository,
  ) {}

  async generateOtp(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(email: string, otpType: OtpType, isResend: boolean = false) {
    await this.otpVerificationRepository
    const otp = await this.generateOtp();
    if (isResend) {
      await this.handleResendOtp(email, otp, otpType);
    } else {
      await this.saveAndSendOtp(email, otp, 1, otpType);
    }
  }


  private async handleResendOtp(email: string, otp: string, otpType: OtpType) {
    const lastOtp = await this.otpVerificationRepository.findOtpVerificationByEmailAndOtpType(
      email,
      otpType,
    );

    if (!lastOtp) {
      await this.saveAndSendOtp(email, otp, 1, otpType);
      return;
    }

    const count = lastOtp.count + 1;
    if (count > 2 && this.isWaitingTime(lastOtp.expiresAt)) {
      throw new AppException(ErrorCode.WATTING_TIME_OTP);
    }

    await this.saveAndSendOtp(email, otp, count, otpType);
  }

  private async saveAndSendOtp(email: string, otp: string, count: number, otpType: OtpType) {
    await this.otpVerificationRepository.saveOTP(email, otp, count, otpType);
    await this.sendOtpEmail(email, otp, otpType);
  }


  private async sendOtpEmail(email: string, otp: string, otpType: OtpType) {
    const subject = otpType === OtpType.FORGOT_PASSWORD ? 'Đặt Lại Mật Khẩu' : 'Xác Minh OTP';
    await this.mailerService.sendMail({
      to: email,
      subject,
      template: 'otp',
      context: { otp, email },
    });
  }

  private isWaitingTime(expiresAt: Date): boolean {
    if (!expiresAt) return false;

    const nowUtc = new Date();
    const timeLeft = (nowUtc.getTime() - expiresAt.getTime()) / 1000;

    return timeLeft > 0 && timeLeft < 180;
  }


  async verifyOtp(email: string, otp: string, otpType: OtpType): Promise<boolean> {
    const otpVerify = await this.otpVerificationRepository.findOtpVerificationByEmailAndOtpType(
      email,
      otpType,
    );

    if (!otpVerify) throw new AppException(ErrorCode.VERIFY_TIME_OUT);
    if (otpVerify.otp !== otp) throw new AppException(ErrorCode.INVALID_OTP);

    // await this.otpVerificationRepository.deleteOtpByEmail(email);
    return true;
  }
}
