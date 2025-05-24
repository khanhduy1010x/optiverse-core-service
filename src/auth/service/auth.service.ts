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

        private usersService: UserService,



  ) {}

      async login(
    user: any,
    ip: string,
    token: string = '',
    isLoginGoogle: boolean = false,
  ): Promise<ApiResponse<LoginResponse> | void> {
    const userGoogle = isLoginGoogle ? await this.validateGoogleUser(user, token) : null;
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

    async validateGoogleUser(user: any, code: string): Promise<User | null> {
    try {
      console.log(code);
      const { data: tokenData } = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
          client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          redirect_uri: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
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
}
