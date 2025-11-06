import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User, UserSchema } from './user.schema';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { UserMembership, UserMembershipSchema } from '../user-memberships/user-membership.schema';
import { UserMembershipModule } from '../user-memberships/user-membership.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserMembership.name, schema: UserMembershipSchema }
    ]),
    forwardRef(() => UserMembershipModule)
  ],
  providers: [UserService, UserRepository],
  exports: [UserService, MongooseModule, UserRepository],
  controllers: [UserController],
})
export class UsersModule {}
