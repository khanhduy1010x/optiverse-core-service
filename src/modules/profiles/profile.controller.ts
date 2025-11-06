import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { JwtPayload } from 'src/auth/dto/JwtPayload.dto';
import { ApiResponse as ApiResponseWrapper } from 'src/common/api-response';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserService } from '../users/user.service';
import { UpdateProfileRequest } from './dto/request/UpdateProfileRequest.dto';
import { ProfileResponse } from './dto/response/ProfileResponse.dto';
import { UserSessionService } from '../users-sessions/user-session.service';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { ErrorCode, ErrorDetails } from '../../common/exceptions/error-code.enum';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@ApiExtraModels(ApiResponseWrapper, ProfileResponse)
@Controller('/profile')
export class ProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly userSessionService: UserSessionService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: JwtPayload,
  })
  @UseGuards(JwtAuthGuard)
  @Get('')
  async getProfile(@Request() req) {
    const user = req.user as JwtPayload;
    const profile = await this.userService.findOneByEmailWithMembership(user.email);
    return profile;
  }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileRequest })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: { $ref: getSchemaPath(ProfileResponse) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: ProfileResponse,
  })
  @UseGuards(JwtAuthGuard)
  @Patch('')
  async updateProfile(
    @Request() req,
    @Body() updateProfileRequest: UpdateProfileRequest,
  ): Promise<ApiResponseWrapper<ProfileResponse> | void> {
    const user = req.user as JwtPayload;

    // Validate name
    if (updateProfileRequest.full_name) {
      // Check if name is blank
      if (!updateProfileRequest.full_name.trim()) {
        throw new BadRequestException({
          statusCode: ErrorDetails[ErrorCode.NAME_IS_BLANK].httpStatus,
          message: ErrorDetails[ErrorCode.NAME_IS_BLANK].message,
          code: ErrorDetails[ErrorCode.NAME_IS_BLANK].code,
        });
      }
      // Check if name contains numbers
      if (/\d/.test(updateProfileRequest.full_name)) {
        throw new BadRequestException({
          statusCode: ErrorDetails[ErrorCode.NAME_CONTAINS_NUMBERS].httpStatus,
          message: ErrorDetails[ErrorCode.NAME_CONTAINS_NUMBERS].message,
          code: ErrorDetails[ErrorCode.NAME_CONTAINS_NUMBERS].code,
        });
      }
      // Check if name contains special characters
      if (/[!@#$%^&*(),.?":{}|<>]/.test(updateProfileRequest.full_name)) {
        throw new BadRequestException({
          statusCode: ErrorDetails[ErrorCode.NAME_CONTAINS_SPECIAL_CHARS].httpStatus,
          message: ErrorDetails[ErrorCode.NAME_CONTAINS_SPECIAL_CHARS].message,
          code: ErrorDetails[ErrorCode.NAME_CONTAINS_SPECIAL_CHARS].code,
        });
      }

      // Check if name is too long (e.g., more than 50 characters)
      if (updateProfileRequest.full_name.length > 25) {
        throw new BadRequestException({
          statusCode: ErrorDetails[ErrorCode.NAME_TOO_LONG].httpStatus,
          message: ErrorDetails[ErrorCode.NAME_TOO_LONG].message,
          code: ErrorDetails[ErrorCode.NAME_TOO_LONG].code,
        });
      }
    }

    const profile = await this.userService.updateProfile(user.user_id, updateProfileRequest);

    if (!profile) {
      return;
    }

    const response = new ProfileResponse(profile);

    return new ApiResponseWrapper<ProfileResponse>(response);
  }

  @ApiOperation({ summary: 'Get all user sessions' })
  @ApiResponse({
    status: 200,
    description: 'User sessions retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  user_id: { type: 'string' },
                  device_info: { type: 'string' },
                  ip_address: { type: 'string' },
                  refresh_token: { type: 'string' },
                },
              },
            },
          },
        },
      ],
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getAllSessions(@Request() req) {
    const user = req.user as JwtPayload;
    const sessions = await this.userSessionService.getAllUserSessions(user.user_id);
    return new ApiResponseWrapper(sessions);
  }

  @ApiOperation({ summary: 'Get user sessions with empty refresh token' })
  @ApiResponse({
    status: 200,
    description: 'User sessions with empty refresh token retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseWrapper) },
        {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  user_id: { type: 'string' },
                  device_info: { type: 'string' },
                  ip_address: { type: 'string' },
                  refresh_token: { type: 'string' },
                },
              },
            },
          },
        },
      ],
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('sessions/empty-tokens')
  async getEmptyTokenSessions(@Request() req) {
    const user = req.user as JwtPayload;
    const sessions = await this.userSessionService.getAllUserSessions(user.user_id);
    const emptyTokenSessions = sessions.filter(
      (session) => !session.refresh_token || session.refresh_token === '',
    );
    return new ApiResponseWrapper(emptyTokenSessions);
  }

  @ApiOperation({ summary: 'Update user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const user = req.user as JwtPayload;

    // Check if file is selected
    if (!file) {
      throw new BadRequestException({
        statusCode: ErrorDetails[ErrorCode.AVATAR_NO_FILE_SELECTED].httpStatus,
        message: ErrorDetails[ErrorCode.AVATAR_NO_FILE_SELECTED].message,
        code: ErrorDetails[ErrorCode.AVATAR_NO_FILE_SELECTED].code,
      });
    }

    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        statusCode: ErrorDetails[ErrorCode.AVATAR_INVALID_FILE_TYPE].httpStatus,
        message: ErrorDetails[ErrorCode.AVATAR_INVALID_FILE_TYPE].message,
        code: ErrorDetails[ErrorCode.AVATAR_INVALID_FILE_TYPE].code,
      });
    }

    const avatarUrl = await this.cloudinaryService.uploadFile(file);
    const updatedUser = await this.userService.updateAvatar(user.user_id, avatarUrl);

    if (!updatedUser) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to update avatar',
        code: 1029,
      });
    }

    return {
      statusCode: 200,
      message: 'Avatar updated successfully',
      data: {
        avatar: avatarUrl,
      },
    };
  }
  @UseGuards(JwtAuthGuard)
  @Post('/chat/theme')
  @UseInterceptors(FileInterceptor('file'))
  async addThemeChat(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseWrapper<String>> {
    const user = req.user as JwtPayload;

    // Check if file is selected
    if (!file) {
      throw new BadRequestException({
        statusCode: ErrorDetails[ErrorCode.AVATAR_NO_FILE_SELECTED].httpStatus,
        message: ErrorDetails[ErrorCode.AVATAR_NO_FILE_SELECTED].message,
        code: ErrorDetails[ErrorCode.AVATAR_NO_FILE_SELECTED].code,
      });
    }

    // // Check file type
    // const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    // if (!allowedMimeTypes.includes(file.mimetype)) {
    //   throw new BadRequestException({
    //     statusCode: ErrorDetails[ErrorCode.AVATAR_INVALID_FILE_TYPE].httpStatus,
    //     message: ErrorDetails[ErrorCode.AVATAR_INVALID_FILE_TYPE].message,
    //     code: ErrorDetails[ErrorCode.AVATAR_INVALID_FILE_TYPE].code,
    //   });
    // }

    const theme = await this.cloudinaryService.uploadFile(file, 'themes-chat');
    console.log(theme);
    return new ApiResponseWrapper<String>(theme);
  }
}
