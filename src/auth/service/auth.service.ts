import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from 'src/common/api-response';
import { AppException } from 'src/common/exceptions/app.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { User } from 'src/modules/users/user.schema';
import { UserSessionService } from 'src/modules/users-sessions/user-session.service';
import { UserService } from 'src/modules/users/user.service';
import { LoginResponse } from '../dto/response/LoginResponse.dto';
import { HashPasswordService } from './hash-password.service';
import { CreateAccountRequest } from '../dto/request/CreateAccountRequest.dto';
import { CreateAccountResponse } from '../dto/response/CreateAccountResponse.dto';
import { UserRepository } from 'src/modules/users/user.repository';
import { plainToInstance } from 'class-transformer';
import { OtpVerificationService } from 'src/modules/otp-verifications/opt-verifications.service';
import { VerifyAccountRequest } from '../dto/request/VerifyAccountRequest.dto';
import { SendOtpRequest } from '../dto/request/SendOtpRequest.dto';
import { OtpType } from 'src/modules/otp-verifications/otp-verifications.schema';
import { ResetPasswordResponse } from '../dto/response/ResetPasswordResponse.dto';
import axios from 'axios';
import { UserSessionRepository } from 'src/modules/users-sessions/user-session.repository';
import { JwtPayload } from '../dto/JwtPayload.dto';
import { UserResponse } from '../dto/response/UserResponse.dto';
@Injectable()
export class AuthService {
   constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userSessionService: UserSessionService,
    private hashPasswordService: HashPasswordService,
    private userRepository: UserRepository,
    private otpVerificationService: OtpVerificationService,
    private userSessionRepository: UserSessionRepository,
  ) {}
  async changePassword(
    user: JwtPayload,
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<null>> {
    const currentUser = await this.usersService.findOne(user.email);
    if (!currentUser || !currentUser.password_hash) throw new AppException(ErrorCode.NOT_FOUND);
    const isEqual = await this.hashPasswordService.comparePassword(
      currentPassword,
      currentUser?.password_hash,
    );
    if (!isEqual) throw new AppException(ErrorCode.CURRENT_PASSWORD_NOT_MATCH);
    const newPasswordHash = await this.hashPasswordService.hashPassword(newPassword);
    this.userRepository.updatePassword(user.email, newPasswordHash);
    return new ApiResponse();
  }

}
