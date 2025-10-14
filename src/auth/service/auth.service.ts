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
    private userSessionService: UserSessionService,
    private userSessionRepository: UserSessionRepository,
    private configService: ConfigService,
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private hashPasswordService: HashPasswordService,
    private otpVerificationService: OtpVerificationService,
    private usersService: UserService,
  ) {}

  async login(
    user: any,
    ip: string,
    token: string = '',
    isLoginGoogle: boolean = false,
    is_web: boolean = false,
  ): Promise<ApiResponse<LoginResponse> | void> {
    const userGoogle = isLoginGoogle ? await this.validateGoogleUser(user, token, is_web) : null;
    const userData = userGoogle ?? user;
    if (!userData) {
      throw new AppException(ErrorCode.NOT_FOUND);
    }
    const userSession = await this.userSessionService.handleSaveTokenLogin({
      user_id: userData._id,
      device_info: userData?.device_info ?? '',
      refresh_token: '',
      ip_address: ip,
    });
    const refresh_token = await this.generateRefreshToken(userData, userSession._id.toString());
    await this.userSessionRepository.updateTokenInSession(
      userSession._id.toString(),
      refresh_token,
    );
    const access_token = await this.generateAccessToken(userData, userSession._id.toString());
    return new ApiResponse<LoginResponse>({ access_token, refresh_token });
  }

  async validateGoogleUser(user: any, code: string, is_web: boolean): Promise<User | null> {
    try {
      console.log(code);
      const { data: tokenData } = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
          client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          redirect_uri: is_web
            ? this.configService.get<string>('GOOGLE_CALLBACK_URL_WEB')
            : this.configService.get<string>('GOOGLE_CALLBACK_URL'),
          grant_type: 'authorization_code',
          code,
        },
      });
      console.log('Lay accesstoken thanh cong: ', tokenData.access_token);
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        throw new AppException(ErrorCode.INVALID_TOKEN_GOOGLE);
      }

      const { data: userData } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { email, name, picture } = userData;
      console.log(userData);
      if (!email) {
        console.log('Email khong ton tai');
        throw new AppException(ErrorCode.INVALID_TOKEN_GOOGLE);
      }

      const existingUser = await this.userRepository.findByEmail(email);
      if (!existingUser) {
        user = Object.assign(new User(), {
          email,
          full_name: name,
          avatar_url: picture,
          isVerified: true,
        });
        return await this.userRepository.save(user);
      }

      return existingUser;
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('Google Token Exchange Error:', error.response.data);
      }
      console.log(error);
      throw new AppException(ErrorCode.INVALID_TOKEN_GOOGLE);
    }
  }
  async generateRefreshToken(user: any, userSession_id: string): Promise<string> {
    const payload = {
      sub: user._id,
      email: user.email,
      full_name: user.full_name,
      session_id: userSession_id,
      role: user.role,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRED'),
    });
  }

  async generateAccessToken(user: any, userSession_id: string): Promise<string> {
    const payload = {
      sub: user._id,
      email: user.email,
      full_name: user.full_name,
      session_id: userSession_id,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findOne(username);
    if (!user || !user.password_hash) return null;
    const isTruePassword = await this.hashPasswordService.comparePassword(pass, user.password_hash);
    if (!isTruePassword) return null;
    return user;
  }

  async createAccount(request: CreateAccountRequest): Promise<ApiResponse<CreateAccountResponse>> {
    try {
      const user = await this.userRepository.findByEmail(request.email);
      if (user ) {
        if( user.isVerified) {
          throw new AppException(ErrorCode.EMAIL_EXISTS);

        }else {
          await this.userRepository.removeAccount(user._id);
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
      console.log(error)
      throw new AppException(ErrorCode.SERVER_ERROR);
    }
  }

  async sendOtp(request: SendOtpRequest): Promise<ApiResponse<null>> {
    const otpType = request.isVerify ? OtpType.EMAIL_VERIFICATION : OtpType.FORGOT_PASSWORD;
    const account = await this.usersService.findOneByEmail(request.email);
    if(!account) {
      throw new AppException(ErrorCode.NOT_FOUND)
    }
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
    const payload = {
      sub: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };
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
    if(currentPassword !== ''){
      if (!currentUser || !currentUser.password_hash) throw new AppException(ErrorCode.NOT_FOUND);
      const isEqual = await this.hashPasswordService.comparePassword(
        currentPassword,
        currentUser?.password_hash,
      );
      if (!isEqual) throw new AppException(ErrorCode.CURRENT_PASSWORD_NOT_MATCH);
    }
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
  async resetNewPassword(user: JwtPayload, newPassword: string): Promise<ApiResponse<null>> {
    console.log(newPassword);
    const passwordHash = await this.hashPasswordService.hashPassword(newPassword);
    const userSaved = this.userRepository.updatePassword(user.email, passwordHash);
    if (!userSaved) throw new AppException(ErrorCode.SERVER_ERROR);
    return new ApiResponse();
  }

  async getUsersByIds(userIds: string[]): Promise<ApiResponse<UserResponse[]>> {
    try {
      const users = await this.userRepository.findUsersByIds(userIds);

      if (!users || users.length === 0) {
        return new ApiResponse<UserResponse[]>([]);
      }

      const userResponses = users.map((user) => {
        return {
          user_id: user._id.toString(),
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url || '',
        } as UserResponse;
      });

      return new ApiResponse<UserResponse[]>(userResponses);
    } catch (error) {
      throw new AppException(ErrorCode.SERVER_ERROR);
    }
  }
  async refreshToken(user: JwtPayload, ip: string): Promise<ApiResponse<LoginResponse>> {
    const refresh_token = await this.generateRefreshToken(
      { ...user, _id: user.user_id },
      user.session_id,
    );
    await this.userSessionRepository.updateTokenInSession(
      user.session_id.toString(),
      refresh_token,
      ip,
    );
    const access_token = await this.generateAccessToken(
      { ...user, _id: user.user_id },
      user.session_id.toString(),
    );
    return new ApiResponse<LoginResponse>({ access_token, refresh_token });
  }
}
