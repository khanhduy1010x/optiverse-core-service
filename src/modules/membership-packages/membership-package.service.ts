import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MembershipPackage, MembershipPackageDocument } from './membership-package.schema';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';
import { CreateMembershipPackageDto, UpdateMembershipPackageDto } from './dto/membership-package.dto';
import { UserMembership, UserMembershipDocument } from '../user-memberships/user-membership.schema';

@Injectable()
export class MembershipPackageService {
  constructor(
    @InjectModel(MembershipPackage.name)
    private membershipPackageModel: Model<MembershipPackageDocument>,
    @InjectModel(UserMembership.name)
    private userMembershipModel: Model<UserMembershipDocument>,
  ) {}

  /**
   * Create a new membership package (Admin only)
   */
  async createMembershipPackage(
    dto: CreateMembershipPackageDto,
  ): Promise<MembershipPackage> {
    try {
      // Check if package with same level already exists
      const existingPackage = await this.membershipPackageModel.findOne({
        level: dto.level,
      });

      if (existingPackage && existingPackage.duration_days === dto.duration_days) {
        throw new AppException(ErrorCode.MEMBERSHIP_PACKAGE_EXISTS);
      }
      console.log('Creating membership package with dto:', dto);

      const newPackage = new this.membershipPackageModel(dto);
      return await newPackage.save();
    } catch (error) {
    //   if (error instanceof AppException) {
    //     throw error;
    //   }
    //   throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    throw error;
    }
  }

  /**
   * Get all membership packages with subscriber count
   */
  async getAllMembershipPackages(): Promise<any[]> {
    const packages = await this.membershipPackageModel.find({ is_active: true }).sort({ level: 1 });
    
    // Get subscriber count for each package
    const packagesWithCount = await Promise.all(
      packages.map(async (pkg) => {
        const subscriberCount = await this.userMembershipModel.countDocuments({
          package_id: pkg._id,
          status: 'active',
        });
        
        return {
          ...pkg.toObject(),
          subscriber_count: subscriberCount,
        };
      }),
    );
    
    return packagesWithCount;
  }

  /**
   * Get membership package by level with subscriber count
   */
  async getMembershipPackageByLevel(level: number): Promise<any> {
    const pkg = await this.membershipPackageModel.findOne({
      level,
      is_active: true,
    });

    if (!pkg) {
      throw new AppException(ErrorCode.MEMBERSHIP_PACKAGE_NOT_FOUND);
    }

    const subscriberCount = await this.userMembershipModel.countDocuments({
      package_id: pkg._id,
      status: 'active',
    });

    return {
      ...pkg.toObject(),
      subscriber_count: subscriberCount,
    };
  }

  /**
   * Update membership package (Admin only)
   */
  async updateMembershipPackage(
    level: number,
    dto: UpdateMembershipPackageDto,
  ): Promise<MembershipPackage> {
    try {
      const pkg = await this.membershipPackageModel.findOneAndUpdate(
        { level },
        { $set: dto },
        { new: true },
      );

      if (!pkg) {
        throw new AppException(ErrorCode.MEMBERSHIP_PACKAGE_NOT_FOUND);
      }

      return pkg;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Deactivate membership package (Admin only)
   */
  async deactivateMembershipPackage(level: number): Promise<MembershipPackage> {
    const pkg = await this.membershipPackageModel.findOneAndUpdate(
      { level },
      { $set: { is_active: false } },
      { new: true },
    );

    if (!pkg) {
      throw new AppException(ErrorCode.MEMBERSHIP_PACKAGE_NOT_FOUND);
    }

    return pkg;
  }

  /**
   * Get membership package by ID with subscriber count
   */
  async getMembershipPackageById(packageId: string): Promise<any> {
    const pkg = await this.membershipPackageModel.findById(packageId);

    if (!pkg) {
      throw new AppException(ErrorCode.MEMBERSHIP_PACKAGE_NOT_FOUND);
    }

 

    return {
      ...pkg.toObject(),
    };
  }

  /**
   * Get membership packages by list of IDs
   */
  async getMembershipPackagesByIds(packageIds: string[]): Promise<any[]> {
    const packages = await this.membershipPackageModel.find({
      _id: { $in: packageIds },
    });

    return packages.map(pkg => ({
      ...pkg.toObject(),
    }));
  }

  /**
   * Get package by level (for internal use - no error thrown)
   */
  async getPackageByLevelSafe(level: number): Promise<MembershipPackage | null> {
    return await this.membershipPackageModel.findOne({
      level,
      is_active: true,
    });
  }

  /**
   * Initialize default membership packages on app startup
   */
  async initializeDefaultPackages(): Promise<void> {
    try {
      const existingPackages = await this.membershipPackageModel.find({});
      
      if (existingPackages.length > 0) {
        console.log('📦 Membership packages already exist. Skipping initialization.');
        return;
      }

      const defaultPackages = [
        {
          level: 0, // BASIC
          name: 'BASIC',
          description: 'Perfect for getting started',
          price: 999999,
          duration_days: 999999, // Effectively unlimited
          opBonusCredits: 0,
          is_active: true,
        },
        {
          level: 1, // PLUS
          name: 'PLUS',
          description: 'Best for active learners',
          price: 999999999,
          duration_days: 999999, // Effectively unlimited
          opBonusCredits: 50000,
          is_active: true,
        },
        {
          level: 2, // BUSINESS
          name: 'BUSINESS',
          description: 'For power users',
          price: 9999999999,
          duration_days: 999999, // Effectively unlimited
          opBonusCredits: 200000,
          is_active: true,
        },
      ];

      await this.membershipPackageModel.insertMany(defaultPackages);
      console.log('✅ Default membership packages initialized successfully!');
      console.log('   - BASIC: 999 VND (unlimited access)');
      console.log('   - PLUS: 999 VND (unlimited access, 50K OP bonus)');
      console.log('   - BUSINESS: 9,999,999 VND (unlimited access, 200K OP bonus)');
    } catch (error) {
      console.error('❌ Failed to initialize default membership packages:', error);
      throw error;
    }
  }
}
