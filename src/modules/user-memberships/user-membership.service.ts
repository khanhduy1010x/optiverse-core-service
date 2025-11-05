import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types,Model } from 'mongoose';
import { UserMembership, UserMembershipDocument, MembershipStatus } from './user-membership.schema';
import { MembershipPackage, MembershipPackageDocument } from '../membership-packages/membership-package.schema';
import { UserService } from '../users/user.service';

@Injectable()
export class UserMembershipService {
  constructor(
    @InjectModel(UserMembership.name)
    private userMembershipModel: Model<UserMembershipDocument>,
    @InjectModel(MembershipPackage.name) 
    private membershipPackageModel: Model<MembershipPackageDocument>,
    private userService: UserService,
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
      user_id: new Types.ObjectId(userId),
      package_id: new Types.ObjectId(packageId),
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

  /**
   * Update membership: create new if not exist, upgrade/extend based on level
   * Returns membership info with package details
   */
  async updateMembership(userId: string, packageId: string): Promise<{ membership: UserMembershipDocument; package: any }> {
    const newPackage = await this.membershipPackageModel.findById(packageId);
    if (!newPackage) {
      throw new Error('Membership package not found');
    }

    const activeMembership = await this.getActiveMembership(userId);

    let updatedMembership: UserMembershipDocument;

    if (!activeMembership) {
      updatedMembership = await this.createMembership(userId, packageId);
    } else {
      const currentPackage = activeMembership.package_id as any;
      const currentLevel = currentPackage.level || 0;
      const newLevel = newPackage.level || 0;

      if (newLevel > currentLevel) {
        const packageSnapshot = {
          name: newPackage.name,
          level: newPackage.level,
          price: newPackage.price,
          duration_days: newPackage.duration_days,
          opBonusCredits: newPackage.opBonusCredits,
        };

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + newPackage.duration_days);

        activeMembership.package_id = new Types.ObjectId(packageId);
        activeMembership.start_date = new Date();
        activeMembership.end_date = endDate;
        (activeMembership as any).package_snapshot = packageSnapshot;

        await this.userMembershipModel.updateMany(
          { user_id: userId, status: MembershipStatus.ACTIVE, _id: { $ne: activeMembership._id } },
          { status: MembershipStatus.CANCELLED }
        );

        updatedMembership = await activeMembership.save();
      } else if (newLevel === currentLevel) {
        const additionalDays = newPackage.duration_days;
        activeMembership.end_date.setDate(activeMembership.end_date.getDate() + additionalDays);

        updatedMembership = await activeMembership.save();
      } else {
        updatedMembership = activeMembership;
      }
    }

    // Add OP bonus credits to user
    if (newPackage.opBonusCredits && newPackage.opBonusCredits > 0) {
      try {
        await this.userService.addOpCredits(userId, newPackage.opBonusCredits);
      } catch (error) {
        console.error(`Failed to add OP credits to user ${userId}:`, error);
        // Don't throw error, membership update is successful even if OP addition fails
      }
    }

    // Populate package info and return both membership and package
    await updatedMembership.populate('package_id');
    
    return {
      membership: updatedMembership,
      package: newPackage.toObject?.() || newPackage,
    };
  }
}
