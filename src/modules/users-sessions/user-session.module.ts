import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from '../users/user.service';
import { User, UserSchema } from '../users/user.schema';
import { UserSession, UserSessionSchema } from './user-session.schema';
import { UserSessionService } from './user-session.service';
import { UserSessionRepository } from './user-session.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }])],
  providers: [UserSessionService, UserSessionRepository],
  exports: [UserSessionService, MongooseModule, UserSessionRepository],
})
export class UserSessionModule {}
