import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';

export type MembershipPackageDocument = MembershipPackage & Document;

export enum PackageLevel {
  BASIC = 0,
  PLUS = 1,
  BUSINESS = 2,
}

@Schema({ timestamps: true })
export class MembershipPackage {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Number, default: 0, min: 0 })
  price: number;

  @Prop({ type: Number, default: 30, min: 1 })
  duration_days: number;

  @Prop({
    type: Number,
    enum: PackageLevel,
    required: true,
  })
  level: PackageLevel;

  @Prop({ type: Number, default: 0, min: 0 })
  opBonusCredits?: number;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MembershipPackageSchema =
  SchemaFactory.createForClass(MembershipPackage);

MembershipPackageSchema.pre<MembershipPackage>('validate', function (next) {
  switch (this.level) {
    case PackageLevel.BASIC:
      this.name = 'BASIC';
  
      break;
    case PackageLevel.PLUS:
      this.name = 'PLUS';

      break;
    case PackageLevel.BUSINESS:
      this.name = 'BUSINESS';
   
      break;
  }
  next();
});

/* 🔹 Index tối ưu */
MembershipPackageSchema.index(
  { level: 1, duration_days: 1 },
  { unique: true, name: 'uniq_level_duration' },
);
MembershipPackageSchema.index({ is_active: 1 }, { name: 'idx_is_active' });
