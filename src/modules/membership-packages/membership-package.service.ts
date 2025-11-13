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
    const defaultPackages = [
      // BASIC (level 0)
      {
        level: 0,
        description: 'Basic weekly package',
        price: 2990,
        duration_days: 7,
        opBonusCredits: 10,
      },
      {
        level: 0,
        description: 'Basic monthly package',
        price: 9900,
        duration_days: 30,
        opBonusCredits: 30,
      },
      {
        level: 0,
        description: 'Basic yearly package',
        price: 79900,
        duration_days: 365,
        opBonusCredits: 400,
      },

      // PLUS (level 1)
      {
        level: 1,
        description: 'Plus weekly package',
        price: 4990,
        duration_days: 7,
        opBonusCredits: 30,
      },
      {
        level: 1,
        description: 'Plus monthly package',
        price: 19900,
        duration_days: 30,
        opBonusCredits: 100,
      },
      {
        level: 1,
        description: 'Plus yearly package',
        price: 179900,
        duration_days: 365,
        opBonusCredits: 1200,
      },

      // BUSINESS (level 2)
      {
        level: 2,
        description: 'Business weekly package',
        price: 9990,
        duration_days: 7,
        opBonusCredits: 100,
      },
      {
        level: 2,
        description: 'Business monthly package',
        price: 39900,
        duration_days: 30,
        opBonusCredits: 300,
      },
      {
        level: 2,
        description: 'Business yearly package',
        price: 299000,
        duration_days: 365,
        opBonusCredits: 3000,
      },
    ];

    for (const pkg of defaultPackages) {
      await this.membershipPackageModel.updateOne(
        { level: pkg.level, duration_days: pkg.duration_days }, // unique key
        {
          $set: {
            description: pkg.description,
            price: pkg.price,
            opBonusCredits: pkg.opBonusCredits,
            is_active: true,
          },
        },
        { upsert: true }
      );
    }

    console.log('✅ Default membership packages (9 packages) initialized!');
  } catch (error) {
    console.error('❌ Failed to initialize membership packages:', error);
    throw error;
  }
}

}
