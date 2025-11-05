import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import mongoose from 'mongoose';

export type UserMembershipDocument = UserMembership & Document;

export enum MembershipStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class UserMembership {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true
  })
  user_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'MembershipPackage',
    required: true
  })
  package_id: Types.ObjectId;

  @Prop({
    type: Date,
    required: true
  })
  start_date: Date;

  @Prop({
    type: Date,
    required: true
  })
  end_date: Date;

  @Prop({
    type: String,
    enum: MembershipStatus,
    default: MembershipStatus.ACTIVE
  })
  status: MembershipStatus;

  @Prop({
    type: Object,
    required: false
  })
  package_snapshot?: any;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserMembershipSchema = SchemaFactory.createForClass(UserMembership);

// Create indexes for better performance
UserMembershipSchema.index({ user_id: 1 });
UserMembershipSchema.index({ package_id: 1 });
UserMembershipSchema.index({ status: 1 });
UserMembershipSchema.index({ end_date: 1 });
UserMembershipSchema.index({ user_id: 1, status: 1 }); // Compound index for active user memberships