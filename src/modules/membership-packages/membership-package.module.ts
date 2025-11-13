import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipPackage, MembershipPackageSchema } from './membership-package.schema';
import { UserMembership, UserMembershipSchema } from '../user-memberships/user-membership.schema';
import { MembershipPackageService } from './membership-package.service';
import { UserMembershipModule } from '../user-memberships/user-membership.module';
import { MembershipPackageController } from './membership-package.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MembershipPackage.name, schema: MembershipPackageSchema },
      { name: UserMembership.name, schema: UserMembershipSchema }
    ]),
    UserMembershipModule
  ],
  providers: [MembershipPackageService],
  controllers: [MembershipPackageController],
  exports: [MembershipPackageService]
})
export class MembershipPackageModule implements OnModuleInit {
  constructor(private membershipPackageService: MembershipPackageService) {}

  async onModuleInit() {
    console.log('🚀 Initializing MembershipPackageModule...');
    await this.membershipPackageService.initializeDefaultPackages();
  }
}