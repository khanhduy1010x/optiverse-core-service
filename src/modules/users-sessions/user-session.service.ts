import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSession } from './user-session.schema';
import { UserSessionRepository } from './user-session.repository';
@Injectable()
export class UserSessionService {
  constructor(private userSessionRepository: UserSessionRepository) {}

  async handleSaveTokenLogin(sessionData: {
    user_id: string;
    device_info: string;
    refresh_token: string;
    ip_address: string;
  }): Promise<UserSession> {
    const userSession = Object.assign(new UserSession(), sessionData);
    return await this.userSessionRepository.addNewSession(userSession);
  }

  async getAllUserSessions(user_id: string): Promise<UserSession[]> {
    return await this.userSessionRepository.getAllUserSessions(user_id);
  }
}
