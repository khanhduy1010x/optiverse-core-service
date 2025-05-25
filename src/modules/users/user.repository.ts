import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { Injectable } from '@nestjs/common';
import { UpdateProfileRequest } from '../profiles/dto/request/UpdateProfileRequest.dto';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
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
    return await this.userModel.findByIdAndUpdate(id, updateProfileRequest);
  }
}
