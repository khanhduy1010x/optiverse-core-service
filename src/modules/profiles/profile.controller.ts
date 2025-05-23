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
} from '@nestjs/common';
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
} from '@nestjs/swagger';
import { UserService } from '../users/user.service';
import { UpdateProfileRequest } from './dto/request/UpdateProfileRequest.dto';
import { ProfileResponse } from './dto/response/ProfileResponse.dto';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@ApiExtraModels(ApiResponseWrapper, ProfileResponse)
@Controller('/profile')
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: JwtPayload,
  })
  @UseGuards(JwtAuthGuard)
  @Get('')
  getProfile(@Request() req) {
    const user = req.user as JwtPayload;
    return user;
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

    const profile = await this.userService.updateProfile(user.user_id, updateProfileRequest);

    if (!profile) {
      return;
    }

    const response = new ProfileResponse(profile);

    return new ApiResponseWrapper<ProfileResponse>(response);
  }
}
