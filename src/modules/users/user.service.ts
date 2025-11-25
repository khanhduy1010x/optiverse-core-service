import { Injectable } from '@nestjs/common';
import { User, UserStatus, UserRole } from './user.schema';
import { UserRepository } from './user.repository';
import { UpdateProfileRequest } from '../profiles/dto/request/UpdateProfileRequest.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async findPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    status?: string,
  ): Promise<{ users: User[]; total: number; totalPages: number }> {
    return await this.userRepository.findPaginated(page, limit, search, role, status);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }
    return user;
  }

  async findOne(username: string): Promise<User | null> {
    return await this.userRepository.findOne(username);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Get user profile with current membership info
   */
  async findOneByEmailWithMembership(email: string): Promise<any | null> {
    return await this.userRepository.findByEmailWithMembership(email);
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return await this.userRepository.findOneByEmailWithPassword(email);
  }
  async updateVerifyAccount(email: string): Promise<User | null> {
    return await this.userRepository.updateVerifyAccount(email);
  }

  async updateProfile(id, updateProfileRequest: UpdateProfileRequest): Promise<User | null> {
    return await this.userRepository.updateProfile(id, updateProfileRequest);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User | null> {
    return await this.userRepository.updateAvatar(userId, avatarUrl);
  }

  async suspendUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppException(ErrorCode.USER_ALREADY_SUSPENDED);
    }

    const updatedUser = await this.userRepository.suspendUser(userId);
    if (!updatedUser) {
      throw new AppException(ErrorCode.SERVER_ERROR);
    }
    return updatedUser;
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new AppException(ErrorCode.USER_ALREADY_ACTIVE);
    }

    const updatedUser = await this.userRepository.activateUser(userId);
    if (!updatedUser) {
      throw new AppException(ErrorCode.SERVER_ERROR);
    }
    return updatedUser;
  }

  async changeUserRole(userId: string, newRole: UserRole): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.role === newRole) {
      throw new AppException(ErrorCode.USER_ALREADY_HAS_ROLE);
    }

    const updatedUser = await this.userRepository.changeUserRole(userId, newRole);
    if (!updatedUser) {
      throw new AppException(ErrorCode.SERVER_ERROR);
    }
    return updatedUser;
  }

  /**
   * Add OP credits to user
   */
  async addOpCredits(userId: string, amount: number): Promise<User | null> {
    if (amount <= 0) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    return await this.userRepository.addOpCredits(userId, amount);
  }

  async softDeleteAccount(userId: string): Promise<User> {
    const user = await this.userRepository.findByIdDelete(userId);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.isDeleted) {
      throw new AppException(ErrorCode.USER_ALREADY_DELETED);
    }

    const deletedUser = await this.userRepository.softDeleteUser(userId);
    if (!deletedUser) {
      throw new AppException(ErrorCode.SERVER_ERROR);
    }
    return deletedUser;
  }
}
