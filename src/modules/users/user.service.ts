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
}
