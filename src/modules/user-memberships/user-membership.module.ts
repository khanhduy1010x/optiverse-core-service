import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserMembership, UserMembershipSchema } from './user-membership.schema';
import { MembershipPackage, MembershipPackageSchema } from '../membership-packages/membership-package.schema';
import { UserMembershipService } from './user-membership.service';
import { UserMembershipController } from './user-membership.controller';
import { UserService } from '../users/user.service';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserMembership.name, schema: UserMembershipSchema },
      { name: MembershipPackage.name, schema: MembershipPackageSchema }
    ]),
   UsersModule
  ],
  providers: [UserMembershipService],
  controllers: [UserMembershipController],
  exports: [UserMembershipService]
})
export class UserMembershipModule {}