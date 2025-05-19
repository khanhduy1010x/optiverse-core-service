import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
export enum OtpType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
}

export type OtpVerificationDocument = OtpVerification & Document;

@Schema({ timestamps: true })
export class OtpVerification {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, enum: Object.values(OtpType) })
  otpType: OtpType;

  @Prop({ default: 1 })
  count: number;

  @Prop({ required: true, default: () => new Date(), expires: 300 })
  expiresAt: Date;
}

export const OtpVerificationSchema = SchemaFactory.createForClass(OtpVerification);
