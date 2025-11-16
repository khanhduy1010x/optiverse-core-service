import { Body, Controller, Post, UseGuards, Request, Get, Param, Response } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { LocalAuthGuard } from '../passport/local-auth.guard';
import { JwtAuthGuard } from '../passport/jwt-auth.guard';
import { Public } from '../decorator/customize';
import { CreateAccountRequest } from '../dto/request/CreateAccountRequest.dto';
import { VerifyAccountRequest } from '../dto/request/VerifyAccountRequest.dto';
import { SendOtpRequest } from '../dto/request/SendOtpRequest.dto';
import { ResetPasswordRequest } from '../dto/request/ResetPasswordRequest.dto';
import { ChangePasswordRequest } from '../dto/request/ChangePasswordRequest.dto';
import { LoginGoogleRequest } from '../dto/request/LoginGoogleRequest.dto';
import { LogOutSingleReques } from '../dto/request/LogOutSingleRequest.dto';
import { JwtPayload } from '../dto/JwtPayload.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  getSchemaPath,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { LoginResponse } from '../dto/response/LoginResponse.dto';

import { ApiResponse as ApiResponseWrapper } from 'src/common/api-response';
import { LoginRequest } from '../dto/request/LoginRequest.dto';
import { CreateAccountResponse } from '../dto/response/CreateAccountResponse.dto';
import { ResetPasswordResponse } from '../dto/response/ResetPasswordResponse.dto';
import { AppException } from 'src/common/exceptions/app.exception';
import { UserService } from 'src/modules/users/user.service';
import { User, UserRole } from 'src/modules/users/user.schema';
import { UserResponse } from '../dto/response/UserResponse.dto';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { UserMembershipService } from 'src/modules/user-memberships/user-membership.service';

@ApiTags('Auth')
@ApiBearerAuth('access-token')
@ApiExtraModels(ApiResponseWrapper, LoginResponse, CreateAccountResponse, ResetPasswordResponse)
@Controller('/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
    private readonly userMembershipService: UserMembershipService,
  ) { }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify JWT and return user info' })
  @ApiOkResponse({ description: 'JWT is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or missing token' })
  async verifyToken(@Request() req, @Response() res) {
    const payload = req.user as JwtPayload;
    const user = await this.userService.findOne(payload.email);
    if (!user) {
      throw new AppException(ErrorCode.NOT_FOUND);
    }
    if (user.status === 'suspended') {
      res.setHeader('X-User-Banned', 'true');
      return res.status(403).json({ code: 'USER_IS_BANNED', message: 'User is banned' });
    }

    // Check user membership
    console.log('Checking user membership for user:', user._id.toString());
    const activeMembership = await this.userMembershipService.getActiveMembership(user._id.toString());
    const membershipLevel = await this.userMembershipService.getUserMembershipLevel(user._id.toString());
    
    // Create enhanced user object with membership info
    const userWithMembership = {
      ...JSON.parse(JSON.stringify(user)),
      membership: {
        level: membershipLevel,
        hasActiveMembership: !!activeMembership,
        packageName: activeMembership?.package_id ? (activeMembership.package_id as any).name : 'Free',
        endDate: activeMembership?.end_date || null,
      }
    };

    let redirectUrl: string | null = null;
    if (user.role === UserRole.ADMIN) {
      redirectUrl = '/admin/dashboard';
    }
    const userInfoBase64 = Buffer.from(JSON.stringify(userWithMembership)).toString('base64');
    res.setHeader('X-User-Info', userInfoBase64);
    if (redirectUrl) {
      res.setHeader('X-Redirect-Url', redirectUrl);
    }
    return res.status(200).json({});
  }

  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user using email & password. Returns access and refresh tokens.',
  })
  @ApiBody({ type: LoginRequest })
  @ApiOkResponse({
    description: 'Successfully logged in',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: { $ref: getSchemaPath(LoginResponse) },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user using email & password. Returns access and refresh tokens.',
  })
  @ApiBody({ type: LoginRequest })
  @ApiOkResponse({
    description: 'Successfully logged in',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: { $ref: getSchemaPath(LoginResponse) },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('/login')
  @Public()
  @UseGuards(LocalAuthGuard)
  handleLogin(@Request() req): Promise<ApiResponseWrapper<LoginResponse> | void> {
    const ip = req.ip?.startsWith('::ffff:') ? req.ip.substring(7) : req.ip;
    return this.authService.login(req.user, ip, '', false);
  }

  @ApiOperation({ summary: 'Register new account' })
  @ApiBody({ type: CreateAccountRequest })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: { $ref: getSchemaPath(CreateAccountResponse) },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Email already exists or invalid data' })
  @Public()
  @Post('/register')
  async createAccount(
    @Body() request: CreateAccountRequest,
  ): Promise<ApiResponseWrapper<CreateAccountResponse>> {
    return this.authService.createAccount(request);
  }

  @ApiOperation({ summary: 'Verify account using OTP' })
  @ApiBody({ type: VerifyAccountRequest })
  @ApiOkResponse({
    description: 'Account verified successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: {
              oneOf: [
                { $ref: getSchemaPath(CreateAccountResponse) },
                { $ref: getSchemaPath(ResetPasswordResponse) },
              ],
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP or expired verification' })
  @Public()
  @Post('verify-account')
  async verifyAccount(
    @Body() request: VerifyAccountRequest,
  ): Promise<ApiResponseWrapper<CreateAccountResponse | ResetPasswordResponse>> {
    return this.authService.verifyAccount(request);
  }

  @ApiOperation({ summary: 'Resend OTP' })
  @ApiBody({ type: SendOtpRequest })
  @ApiOkResponse({
    description: 'OTP sent successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          properties: {
            data: { type: 'null', example: null },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Too many OTP requests' })
  @Public()
  @Post('resend-otp')
  async resendOtp(@Body() request: SendOtpRequest): Promise<ApiResponseWrapper<null>> {
    return this.authService.sendOtp(request);
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiBody({ type: ChangePasswordRequest })
  @ApiOkResponse({
    description: 'Password changed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          properties: {
            data: { type: 'null', example: null },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Current password does not match' })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async handleChangPassword(
    @Request() req,
    @Body() request: ChangePasswordRequest,
  ): Promise<ApiResponseWrapper<null>> {
    const user = req.user as JwtPayload;
    const currentUser = await this.userService.findOneByEmailWithPassword(user.email);
    console.log('!currentUser?.password_hash:', !currentUser?.password_hash);
    if (!currentUser?.password_hash) {
      console.log('Inside if block - user has no password hash');
      // Check if new password is empty
      if (!request.newPassword?.trim()) {
        throw new AppException(ErrorCode.NEW_PASSWORD_EMPTY);
      }

      // Check if new password is same as old password
      if (request.currentPassword === request.newPassword) {
        throw new AppException(ErrorCode.PASSWORD_SAME_AS_OLD);
      }

      // Check password format (at least 8 characters)
      if (request.newPassword.length < 8) {
        throw new AppException(ErrorCode.PASSWORD_FORMAT_INVALID);
      }

      return await this.authService.changePassword(
        user,
        '',
        request.newPassword,
      );
    }
    // Check if old password is empty
    if (!request.currentPassword?.trim()) {
      throw new AppException(ErrorCode.OLD_PASSWORD_EMPTY);
    }

    // Check if new password is empty
    if (!request.newPassword?.trim()) {
      throw new AppException(ErrorCode.NEW_PASSWORD_EMPTY);
    }

    // Check if new password is same as old password
    if (request.currentPassword === request.newPassword) {
      throw new AppException(ErrorCode.PASSWORD_SAME_AS_OLD);
    }

    // Check password format (at least 8 characters)
    if (request.newPassword.length < 8) {
      throw new AppException(ErrorCode.PASSWORD_FORMAT_INVALID);
    }

    return await this.authService.changePassword(
      user,
      request.currentPassword,
      request.newPassword,
    );
  }

  @ApiOperation({ summary: 'Logout from a single session' })
  @ApiBody({ type: LogOutSingleReques })
  @ApiOkResponse({
    description: 'Logged out from single session successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          properties: {
            data: { type: 'null', example: null },
          },
        },
      ],
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post('log-out-single')
  async logOutSingle(
    @Request() req,
    @Body() request: LogOutSingleReques,
  ): Promise<ApiResponseWrapper<null>> {
    const user = req.user as JwtPayload;
    return await this.authService.logOutSingle(user, request.session_id);
  }

  @ApiOperation({ summary: 'Logout from multiple sessions' })
  @ApiBody({ type: LogOutSingleReques })
  @ApiOkResponse({
    description: 'Logged out from multiple sessions successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          properties: {
            data: { type: 'null', example: null },
          },
        },
      ],
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post('log-out-multi')
  async logOutMutil(@Request() req): Promise<ApiResponseWrapper<null>> {
    const user = req.user as JwtPayload;
    return await this.authService.logOutMutil(user);
  }

  @ApiOperation({ summary: 'Send OTP for password reset' })
  @ApiBody({ type: SendOtpRequest })
  @ApiOkResponse({
    description: 'OTP sent for password reset',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          properties: {
            data: { type: 'null', example: null },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Too many OTP requests' })
  @Public()
  @Post('send-otp-reset-password')
  async sendOtpResetPassword(@Body() request: SendOtpRequest): Promise<ApiResponseWrapper<null>> {
    return this.authService.sendOtp(request);
  }

  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordRequest })
  @ApiOkResponse({
    description: 'Password reset successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          properties: {
            data: { type: 'null', example: null },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid reset token' })
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  async resetPassword(
    @Request() req,
    @Body() request: ResetPasswordRequest,
  ): Promise<ApiResponseWrapper<null>> {
    const user = req.user as JwtPayload;
    return await this.authService.resetNewPassword(user, request.newPassword);
  }

  @Public()
  @Get('get-info-by-email/:email')
  async getInfoByEmail(@Param('email') email: string) {
    return await this.userService.findOneByEmail(email);
  }

  @ApiOperation({ summary: 'Get users by array of IDs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userIds: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of user IDs',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(UserResponse) },
            },
          },
        },
      ],
    },
  })
  @Public()
  @Post('get-users-by-ids')
  async getUsersByIds(
    @Body() request: { userIds: string[] },
  ): Promise<ApiResponseWrapper<UserResponse[]>> {
    return await this.authService.getUsersByIds(request.userIds);
  }
  @ApiOperation({ summary: 'Login with Google' })
  @ApiBody({ type: LoginGoogleRequest })
  @ApiOkResponse({
    description: 'Google login successful',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: { $ref: getSchemaPath(LoginResponse) },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid Google token' })
  @Public()
  @Post('google')
  async googleLogin(
    @Request() req,
    @Body() request: LoginGoogleRequest,
  ): Promise<ApiResponseWrapper<LoginResponse> | void> {
    const ip = req.ip?.startsWith('::ffff:') ? req.ip.substring(7) : req.ip;
    return this.authService.login(null, ip, request.token, true, request.is_web);
  }
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({
    description: 'Access token refreshed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: { $ref: getSchemaPath(LoginResponse) },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  async hanleRefreshToken(@Request() req): Promise<ApiResponseWrapper<LoginResponse>> {
    const user = req.user as JwtPayload;
    const ip = req.ip?.startsWith('::ffff:') ? req.ip.substring(7) : req.ip;
    return await this.authService.refreshToken(user, ip);
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyInfo(@Request() req): Promise<ApiResponseWrapper<UserResponse>> {
    const user = req.user as JwtPayload;
    const userInfo = await this.userService.findOne(user.email);
    if (!userInfo) throw new AppException(ErrorCode.NOT_FOUND);
    return new ApiResponseWrapper<UserResponse>({
      user_id: userInfo._id.toString(),
      email: userInfo.email,
      full_name: userInfo.full_name,
      avatar_url: userInfo.avatar_url,
    });
  }
}
