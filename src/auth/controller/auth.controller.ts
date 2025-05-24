import { Body, Controller, Post, UseGuards, Request, Get, Param } from '@nestjs/common';
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
import { User } from 'src/modules/users/user.schema';
import { UserResponse } from '../dto/response/UserResponse.dto';

@ApiTags('Auth')
@ApiBearerAuth('access-token')
@ApiExtraModels(ApiResponseWrapper, LoginResponse, CreateAccountResponse, ResetPasswordResponse)
@Controller('/auth')
export class AuthController {
  
  constructor(private authService: AuthService,
    private readonly userService: UserService,
  ) {}

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



}
