import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserStatus, UserRole } from './user.schema';
import { Injectable } from '@nestjs/common';
import { UpdateProfileRequest } from '../profiles/dto/request/UpdateProfileRequest.dto';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

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

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).lean(); // dùng .lean() để trả về plain object
    if (user) {
      const { password_hash, ...rest } = user;
      return rest;
    }
    return user;
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
}
