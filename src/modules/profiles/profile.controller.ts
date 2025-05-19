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
  
}
