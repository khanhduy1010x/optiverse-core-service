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
  
  /**
   * Get dashboard statistics for admin
   * @param periodDays - Number of days to look back (7, 30, 90, 365)
   */
  async getDashboardStats(periodDays: number = 30) {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const expiringDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all packages
    const packages = await this.membershipPackageModel.find({ is_active: true }).exec();

    // Get all active memberships with package details
    const activeMemberships = await this.userMembershipModel
      .find({
        status: MembershipStatus.ACTIVE,
        end_date: { $gt: now }
      })
      .populate('package_id')
      .exec();

    // Calculate stats per package
    const packageStats = await Promise.all(packages.map(async pkg => {
      const pkgMemberships = activeMemberships.filter(
        m => {
          const packageId = m.package_id as any;
          return packageId._id.toString() === pkg._id.toString();
        }
      );

      // Count expired and cancelled for this package
      const expiredCount = await this.userMembershipModel.countDocuments({
        package_id: pkg._id,
        status: MembershipStatus.EXPIRED
      });

      const cancelledCount = await this.userMembershipModel.countDocuments({
        package_id: pkg._id,
        status: MembershipStatus.CANCELLED
      });

      // Calculate new subscribers for this package in period
      const newSubs = await this.userMembershipModel.countDocuments({
        package_id: pkg._id,
        createdAt: { $gte: periodStart }
      });

      // Calculate expiring for this package
      const expiringForPkg = await this.userMembershipModel.countDocuments({
        package_id: pkg._id,
        status: MembershipStatus.ACTIVE,
        end_date: { $gte: now, $lte: expiringDate }
      });

      const revenue = pkg.price * pkgMemberships.length;

      // Format package name based on level and duration
      let formattedName = pkg.name;
      const levelNames = ['Basic', 'Plus', 'Business'];
      const levelName = levelNames[pkg.level] || pkg.name;
      
      if (pkg.duration_days === 7) {
        formattedName = `${levelName} Weekly`;
      } else if (pkg.duration_days === 30) {
        formattedName = `${levelName} Monthly`;
      } else if (pkg.duration_days === 365) {
        formattedName = `${levelName} Yearly`;
      }

      return {
        packageId: pkg._id.toString(),
        packageName: formattedName,
        packageLevel: pkg.level,
        level: pkg.level,
        activeUsers: pkgMemberships.length,
        expiredUsers: expiredCount,
        cancelledUsers: cancelledCount,
        revenue: revenue,
        totalRevenue: revenue,
        newSubscribers: newSubs,
        expiringSubscribers: expiringForPkg,
        percentageOfTotal: 0, // Will calculate after
        averageDuration: pkg.duration_days,
        conversionRate: 0 // Can be calculated if we have trial/conversion data
      };
    }));

    // Get new subscribers in period
    const newSubscribers = await this.userMembershipModel.countDocuments({
      createdAt: { $gte: periodStart }
    });

    // Calculate total revenue and percentage
    const totalRevenue = packageStats.reduce((sum, pkg) => sum + pkg.revenue, 0);
    packageStats.forEach(pkg => {
      pkg.percentageOfTotal = totalRevenue > 0 
        ? Math.round((pkg.revenue / totalRevenue) * 100 * 10) / 10 
        : 0;
    });

    // Get expiring subscriptions in next 7 days (total)
    const expiringSubscribers = await this.userMembershipModel.countDocuments({
      status: MembershipStatus.ACTIVE,
      end_date: { $gte: now, $lte: expiringDate }
    });

    // Calculate monthly revenue for the last 12 months
    const monthlyRevenue = await this.getMonthlyRevenue(12);

    // Calculate total active users
    const totalActiveUsers = packageStats.reduce((sum, pkg) => sum + pkg.activeUsers, 0);

    return {
      packages: packageStats,
      monthlyRevenue,
      totalRevenue,
      totalActiveUsers,
      newSubscribers7Days: newSubscribers,
      expiringSubscribers7Days: expiringSubscribers
    };
  }

  /**
   * Get monthly revenue data for specified number of months
   */
  async getMonthlyRevenue(months: number = 12) {
    const now = new Date();
    const result: Array<{ month: string; revenue: number; subscribers: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = monthDate.toLocaleString('default', { month: 'short' });

      // Get memberships created in this month
      const memberships = await this.userMembershipModel
        .find({
          createdAt: { $gte: monthDate, $lt: nextMonth }
        })
        .populate('package_id')
        .exec();

      // Calculate revenue for the month
      const revenue = memberships.reduce((sum, membership) => {
        const pkg = membership.package_id as any;
        return sum + (pkg?.price || 0);
      }, 0);

      result.push({
        month: monthName,
        revenue,
        subscribers: memberships.length
      });
    }

    return result;
  }

  /**
   * Get subscription history with filtering
   */
  async getSubscriptionHistory(fromDate?: Date, toDate?: Date) {
    const query: any = {};
    
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = fromDate;
      if (toDate) query.createdAt.$lte = toDate;
    }

    const subscriptions = await this.userMembershipModel
      .find(query)
      .populate('user_id', 'email username')
      .populate('package_id')
      .sort({ createdAt: -1 })
      .limit(100) // Limit to recent 100
      .exec();

    return subscriptions.map(sub => {
      const user = sub.user_id as any;
      const pkg = sub.package_id as any;

      // Format package name based on level and duration
      let formattedName = pkg?.name || 'Unknown';
      if (pkg) {
        const levelNames = ['Basic', 'Plus', 'Business'];
        const levelName = levelNames[pkg.level] || pkg.name;
        
        if (pkg.duration_days === 7) {
          formattedName = `${levelName} Weekly`;
        } else if (pkg.duration_days === 30) {
          formattedName = `${levelName} Monthly`;
        } else if (pkg.duration_days === 365) {
          formattedName = `${levelName} Yearly`;
        }
      }

      return {
        userId: user?._id?.toString() || '',
        userName: user?.username || user?.email || 'Unknown',
        packageName: formattedName,
        packageLevel: pkg?.level,
        startDate: sub.start_date,
        endDate: sub.end_date,
        status: sub.status,
        revenue: pkg?.price || 0
      };
    });
  }

  /**
   * Get expiring subscriptions in next N days
   */
  async getExpiringSubscriptions(days: number = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const expiring = await this.userMembershipModel
      .find({
        status: MembershipStatus.ACTIVE,
        end_date: { $gte: now, $lte: futureDate }
      })
      .populate('user_id', 'email username')
      .populate('package_id')
      .sort({ end_date: 1 })
      .exec();

    return expiring.map(sub => {
      const user = sub.user_id as any;
      const pkg = sub.package_id as any;

      return {
        userId: user?._id?.toString() || '',
        userName: user?.username || user?.email || 'Unknown',
        packageName: pkg?.name || 'Unknown',
        endDate: sub.end_date,
        daysRemaining: Math.ceil((sub.end_date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      };
    });
  }
}
