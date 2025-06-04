import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { UserSession } from './user-session.schema';
import { Types } from 'mongoose';
@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectModel(UserSession.name)
    private readonly userSessionModel: Model<UserSession>,
  ) {}

  async validateIsActive(_id: string): Promise<boolean> {
    const userSession = await this.userSessionModel.findOne({ _id: new Types.ObjectId(_id) });
    if (!userSession || !userSession.refresh_token || userSession.refresh_token == '') {
      return false;
    }
    return true;
  }

  async getAllUserSessions(user_id: string): Promise<UserSession[]> {
    return await this.userSessionModel.find({ user_id: new Types.ObjectId(user_id) }).exec();
  }

  async removeRefreshToken_Single(_id: string, user_id: string): Promise<UserSession | null> {
    return await this.userSessionModel.findOneAndUpdate(
      { _id: new Types.ObjectId(_id), user_id: new Types.ObjectId(user_id) },
      { refresh_token: '' },
    );
  }
  async removeRefreshToken_Multi(user_id: string, session_id: string): Promise<number | null> {
    const condition = {
      $and: [
        { user_id: new Types.ObjectId(user_id) },
        { _id: { $ne: new Types.ObjectId(session_id) } },
      ],
    };
    const result = await this.userSessionModel.updateMany(condition, { refresh_token: '' });
    return result.modifiedCount;
  }

  async addNewSession(userSession: UserSession): Promise<UserSession> {
    return this.userSessionModel.create(userSession);
  }

  async updateTokenInSession(
    _id: string,
    refresh_token: string,
    ip: string = '',
  ): Promise<UserSession | null> {
    const updateData: any = { refresh_token };
    if (ip) {
      updateData.ip_address = ip;
    }

    return await this.userSessionModel.findOneAndUpdate({ _id }, updateData, { new: true });
  }
}
