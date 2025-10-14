import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OtpType, OtpVerification } from './otp-verifications.schema';
import { Model } from 'mongoose';
@Injectable()
export class OtpVerificationRepository {
  constructor(@InjectModel(OtpVerification.name) private otpVerification: Model<OtpVerification>) {}
  async saveOTP(
    email: string,
    otp: string,
    count: number,
    type: OtpType,
  ): Promise<OtpVerification> {
    return await this.otpVerification.findOneAndUpdate(
      { email, otpType: type },
      {
        otp: otp,
        count: count,
        expiresAt: new Date(),
      },
      { upsert: true, new: true },
    );
  }

  async findOtpVerificationByEmailAndOtpType(
    email: string,
    otp: OtpType,
  ): Promise<OtpVerification | null> {
    return await this.otpVerification.findOne({ email, otpType: otp });
  }

  async removeOldOTP(email:string): Promise<void> {
    await this.otpVerification.findOneAndDelete({email: email});
  }
}
