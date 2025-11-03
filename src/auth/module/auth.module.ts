import { Module } from '@nestjs/common';
import { UsersModule } from 'src/modules/users/user.module';
import { AuthService } from '../service/auth.service';
import { LocalStrategy } from '../passport/local.strategy';
import { AuthController } from '../controller/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UserSessionModule } from 'src/modules/users-sessions/user-session.module';
import { JwtStrategy } from '../passport/jwt.strategy';
import { JwtAuthGuard } from '../passport/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { HashPasswordService } from '../service/hash-password.service';
import { OtpVerificationModule } from 'src/modules/otp-verifications/otp-verifications.module';
import { GoogleStrategy } from '../passport/google.strategy';
import { RolesGuard } from '../passport/roles.guard';
import { UserMembershipModule } from 'src/modules/user-memberships/user-membership.module';

@Module({
  imports: [
    OtpVerificationModule,
    UsersModule,
    PassportModule,
    UserSessionModule,
    UserMembershipModule,
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRED'),
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'google' }),
  ],
  providers: [
    GoogleStrategy,
    AuthService,
    LocalStrategy,
    JwtStrategy,
    ConfigService,
    HashPasswordService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
