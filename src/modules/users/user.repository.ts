import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserStatus, UserRole } from './user.schema';
import { Injectable } from '@nestjs/common';
import { UpdateProfileRequest } from '../profiles/dto/request/UpdateProfileRequest.dto';
import { UserMembership } from '../user-memberships/user-membership.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(UserMembership.name) private readonly membershipModel: Model<UserMembership>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userModel.find().lean();
  }

  async findPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    status?: string,
  ): Promise<{ users: User[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    // Build search and filter query
    const query: any = {};

    // Add search query
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Add role filter
    if (role && role !== 'all') {
      query.role = role;
    }

    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query).select('-password_hash').skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      totalPages,
    };
  }

  async findById(id: string): Promise<User | null> {
    return await this.userModel.findById(id).lean();
  }
   async findByIdDelete(id: string): Promise<User | null> {
    return await this.userModel.findById(id).where('isDeleted').equals(false).lean();
  }

  async findByEmail(email: string): Promise<any | null> {
    const user = await this.userModel.findOne({ email }).lean(); // dùng .lean() để trả về plain object
    if (user) {
      const has_password = user.password_hash ? true : false;
      const { password_hash, ...rest } = user;
      return { ...rest, has_password };
    }
    return user;
  }
  
  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email }).lean();
  }
  async save(user: User): Promise<User | null> {
    return this.userModel.create(user);
  }

  async updatePassword(email: string, newPassword: string): Promise<User | null> {
    return this.userModel.findOneAndUpdate(
      { email: email },
      { password_hash: newPassword },
      { new: true },
    );
  }

  async findOne(username: string): Promise<User | null> {
    return this.userModel.findOne({ email: username }).lean();
  }

  async updateVerifyAccount(email: string): Promise<User | null> {
    return await this.userModel
      .findOneAndUpdate({ email: email }, { isVerified: true }, { new: true })
      .lean();
  }

  async updateProfile(id, updateProfileRequest: UpdateProfileRequest): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(id, updateProfileRequest, { new: true });
  }

  async findUsersByIds(userIds: string[]): Promise<User[]> {
    return await this.userModel.find({ _id: { $in: userIds } }).lean();
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User | null> {
    return await this.userModel
      .findByIdAndUpdate(userId, { avatar_url: avatarUrl }, { new: true })
      .lean();
  }

  async suspendUser(userId: string): Promise<User | null> {
    return await this.userModel
      .findByIdAndUpdate(userId, { status: UserStatus.SUSPENDED }, { new: true })
      .lean();
  }

  async activateUser(userId: string): Promise<User | null> {
    return await this.userModel
      .findByIdAndUpdate(userId, { status: UserStatus.ACTIVE }, { new: true })
      .lean();
  }

  async changeUserRole(userId: string, role: UserRole): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(userId, { role }, { new: true }).lean();
  }

  async addOpCredits(userId: string, amount: number): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { op_credits: amount } },
      { new: true }
    ).lean();
  }

  async removeAccount(userId: string): Promise<void> {
    await this.userModel.deleteOne({ _id: userId });
  }

  async softDeleteUser(userId: string): Promise<User | null> {
    return await this.userModel
      .findByIdAndUpdate(
        userId,
        { isDeleted: true, password_hash: null },
        { new: true }
      )
      .lean();
  }

  /**
   * Get user profile with current membership info
   */
  async findByEmailWithMembership(email: string): Promise<any | null> {
    const user = await this.userModel.findOne({ email }).lean();
    if (!user) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    const has_password = !!password_hash;

    // Get current active membership
    const membership = await this.membershipModel
      .findOne({
        user_id: user._id,
        status: 'active',
        end_date: { $gte: new Date() },
      })
      .populate('package_id')
      .lean();

    // Build response
    const response: any = {
      ...userWithoutPassword,
      has_password,
      membership: null,
    };

    if (membership) {
      response.membership = {
        package_id: membership.package_id,
        level: membership.package_snapshot?.level,
        name: membership.package_snapshot?.name,
        start_date: membership.start_date,
        end_date: membership.end_date,
        status: membership.status,
      };
    }

    return response;
  }
}
