import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [UsersModule],
  controllers: [ProfileController],
})
export class ProfilesModule {}
