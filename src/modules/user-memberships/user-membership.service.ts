import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types,Model } from 'mongoose';
import { UserMembership, UserMembershipDocument, MembershipStatus } from './user-membership.schema';
import { MembershipPackage, MembershipPackageDocument } from '../membership-packages/membership-package.schema';

@Injectable()
export class UserMembershipService {
  constructor(
    @InjectModel(UserMembership.name)
    private userMembershipModel: Model<UserMembershipDocument>,
    @InjectModel(MembershipPackage.name) 
    private membershipPackageModel: Model<MembershipPackageDocument>,
  ) {}

  /**
   * Get active membership for a user
   */
  async getActiveMembership(userId: string): Promise<UserMembershipDocument | null> {
    return this.userMembershipModel
      .findOne({
        user_id: new Types.ObjectId(userId),
        status: MembershipStatus.ACTIVE,
        end_date: { $gt: new Date() } // Not expired
      })
      .populate('package_id')
      .exec();
  }

  /**
   * Check if user has active membership
   */
  async hasActiveMembership(userId: string): Promise<boolean> {
    const membership = await this.getActiveMembership(userId);
    return !!membership;
  }

  /**
   * Get user's membership level (0=Free, 1=Premium, 2=VIP)
   */
  async getUserMembershipLevel(userId: string): Promise<number> {
    const membership = await this.getActiveMembership(userId);
    if (!membership || !membership.package_id) {
      return 0; // Default to Free level
    }
    
    const membershipPackage = membership.package_id as any;
    return membershipPackage.level || 0;
  }

  /**
   * Create a new membership for user
   */
  async createMembership(
    userId: string, 
    packageId: string, 
    startDate: Date = new Date()
  ): Promise<UserMembershipDocument> {
    // Get package info to calculate end date
    const membershipPackage = await this.membershipPackageModel.findById(packageId);
    if (!membershipPackage) {
      throw new Error('Membership package not found');
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + membershipPackage.duration_days);

    // Deactivate existing active memberships
    await this.userMembershipModel.updateMany(
      { 
        user_id: userId, 
        status: MembershipStatus.ACTIVE 
      },
      { 
        status: MembershipStatus.CANCELLED 
      }
    );

    // Create new membership
    const newMembership = new this.userMembershipModel({
      user_id: userId,
      package_id: packageId,
      start_date: startDate,
      end_date: endDate,
      status: MembershipStatus.ACTIVE
    });

    return newMembership.save();
  }

  /**
   * Cancel user's active membership
   */
  async cancelMembership(userId: string): Promise<void> {
    await this.userMembershipModel.updateMany(
      { 
        user_id: userId, 
        status: MembershipStatus.ACTIVE 
      },
      { 
        status: MembershipStatus.CANCELLED 
      }
    );
  }

  /**
   * Get all expired memberships
   */
  async getExpiredMemberships(): Promise<UserMembershipDocument[]> {
    return this.userMembershipModel
      .find({
        status: MembershipStatus.ACTIVE,
        end_date: { $lt: new Date() }
      })
      .exec();
  }

  /**
   * Mark expired memberships as expired
   */
  async markExpiredMemberships(): Promise<number> {
    const result = await this.userMembershipModel.updateMany(
      {
        status: MembershipStatus.ACTIVE,
        end_date: { $lt: new Date() }
      },
      {
        status: MembershipStatus.EXPIRED
      }
    );

    return result.modifiedCount;
  }

  /**
   * Delete expired memberships (for cleanup)
   */
  async deleteExpiredMemberships(): Promise<number> {
    const result = await this.userMembershipModel.deleteMany({
      status: MembershipStatus.EXPIRED,
      end_date: { $lt: new Date(Date.now()) } // Older than 30 days
    });

    return result.deletedCount;
  }

  /**
   * Get user's membership history
   */
  async getUserMembershipHistory(userId: string): Promise<UserMembershipDocument[]> {
    return this.userMembershipModel
      .find({ user_id: userId })
      .populate('package_id')
      .sort({ created_at: -1 })
      .exec();
  }
}