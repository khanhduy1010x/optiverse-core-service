import { Injectable } from '@nestjs/common';
import { User } from './user.schema';
import { UserRepository } from './user.repository';
import { UpdateProfileRequest } from '../profiles/dto/request/UpdateProfileRequest.dto';
@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}
  async findOne(username: string): Promise<User | null> {
    return await this.userRepository.findOne(username);
  }
   async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }
  async updateVerifyAccount(email: string): Promise<User | null> {
    return await this.userRepository.updateVerifyAccount(email);
  }

  async updateProfile(id, updateProfileRequest: UpdateProfileRequest): Promise<User | null> {
    return await this.userRepository.updateProfile(id, updateProfileRequest);
  }
}
