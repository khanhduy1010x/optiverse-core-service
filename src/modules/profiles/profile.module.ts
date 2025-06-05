import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { UsersModule } from '../users/user.module';
import { UserSessionModule } from '../users-sessions/user-session.module';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';

@Module({
  imports: [UsersModule, UserSessionModule, CloudinaryModule],
  controllers: [ProfileController],
})
export class ProfilesModule {}
