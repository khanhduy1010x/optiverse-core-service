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

  async createAccount(request: CreateAccountRequest): Promise<ApiResponse<CreateAccountResponse>> {
    try {
      const user = await this.userRepository.findByEmail(request.email);
      if (user) {
        if (user.isVerified) {
          throw new AppException(ErrorCode.EMAIL_EXISTS);
        } else {
          throw new AppException(ErrorCode.EMAIL_EXISTS_NOT_VERIFY);
        }
      }
      const hashedPassword = await this.hashPasswordService.hashPassword(request.password);
      const userModel = plainToInstance(User, {
        email: request.email,
        full_name: request.full_name,
        password_hash: hashedPassword,
      });
      const userSaved = await this.userRepository.save(userModel);
      if (!userSaved) throw new AppException(ErrorCode.SERVER_ERROR);
      const createAccountResp = Object.assign(new CreateAccountResponse(), {
        email: userSaved.email,
        user_id: userSaved._id,
        verify: false,
      });
      await this.otpVerificationService.sendOtp(userSaved.email, OtpType.EMAIL_VERIFICATION);
      return new ApiResponse<CreateAccountResponse>(createAccountResp);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(ErrorCode.SERVER_ERROR);
    }
  }

  async sendOtp(request: SendOtpRequest): Promise<ApiResponse<null>> {
    const otpType = request.isVerify ? OtpType.EMAIL_VERIFICATION : OtpType.FORGOT_PASSWORD;
    await this.otpVerificationService.sendOtp(request.email, otpType, true);
    return new ApiResponse();
  }


  async verifyAccount(
    request: VerifyAccountRequest,
  ): Promise<ApiResponse<CreateAccountResponse | ResetPasswordResponse>> {
    const otpType = request.isVerify ? OtpType.EMAIL_VERIFICATION : OtpType.FORGOT_PASSWORD;
    const isVerify = await this.otpVerificationService.verifyOtp(
      request.email,
      request.otp,
      otpType,
    );
    if (!isVerify) throw new AppException(ErrorCode.INVALID_OTP);
    const userVerify = await this.usersService.updateVerifyAccount(request.email);
    if (request.isVerify) {
      const createAccountResp = Object.assign(new CreateAccountResponse(), {
        email: userVerify?.email,
        user_id: userVerify?._id,
        verify: userVerify?.isVerified,
      });
      return new ApiResponse<CreateAccountResponse>(createAccountResp);
    }
    const user = await this.usersService.findOne(request.email);
    return new ApiResponse<ResetPasswordResponse>({
      reset_token: await this.generateResetToken(user),
    });
  }

   async generateResetToken(user: any): Promise<string> {
    const payload = { sub: user._id, email: user.email, full_name: user.full_name };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_RESET_PASSWORD_TOKEN_EXPIRED'),
    });
  }

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

   async logOutSingle(user: JwtPayload, _id: string): Promise<ApiResponse<null>> {
    await this.userSessionRepository.removeRefreshToken_Single(_id, user.user_id);
    return new ApiResponse();
   }

  async logOutMutil(user: JwtPayload): Promise<ApiResponse<null>> {
    await this.userSessionRepository.removeRefreshToken_Multi(user.user_id, user.session_id);
    return new ApiResponse();
  }

}
