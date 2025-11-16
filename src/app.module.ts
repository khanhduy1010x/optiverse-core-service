import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { AuthModule } from './auth/module/auth.module';
import { OtpVerificationModule } from './modules/otp-verifications/otp-verifications.module';

import { ProfilesModule } from './modules/profiles/profile.module';
import { LoggerMiddleware } from './common/logger/logger.middleware';
import { UsersModule } from './modules/users/user.module';
import { MembershipPackageModule } from './modules/membership-packages/membership-package.module';
import { UserMembershipModule } from './modules/user-memberships/user-membership.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    UsersModule,
    DatabaseModule,
    AuthModule,
    ProfilesModule,
    OtpVerificationModule,
    MembershipPackageModule,
    UserMembershipModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
