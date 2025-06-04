import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { UsersModule } from '../users/user.module';
import { UserSessionModule } from '../users-sessions/user-session.module';

@Module({
  imports: [UsersModule, UserSessionModule],
  controllers: [ProfileController],
})
export class ProfilesModule {}
