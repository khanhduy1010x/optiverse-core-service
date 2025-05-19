import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { Injectable } from '@nestjs/common';
import { UpdateProfileRequest } from '../profiles/dto/request/UpdateProfileRequest.dto';

@Injectable()
export class UserRepository {
  
}
