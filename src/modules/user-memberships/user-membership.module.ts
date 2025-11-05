import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserMembership, UserMembershipSchema } from './user-membership.schema';
import { MembershipPackage, MembershipPackageSchema } from '../membership-packages/membership-package.schema';
import { UserMembershipService } from './user-membership.service';
import { UserMembershipController } from './user-membership.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserMembership.name, schema: UserMembershipSchema },
      { name: MembershipPackage.name, schema: MembershipPackageSchema }
    ])
  ],
  providers: [UserMembershipService],
  controllers: [UserMembershipController],
  exports: [UserMembershipService]
})
export class UserMembershipModule {}