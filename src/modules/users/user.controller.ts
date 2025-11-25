import {
  Controller,
  Get,
  Param,
  Post,
  Delete,
  UseGuards,
  Request,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse } from '../../common/api-response';
import { UserService } from './user.service';
import { User, UserRole } from './user.schema';
import { Roles } from '../../auth/decorator/customize';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ChangeRoleRequest } from './dto/ChangeRoleRequest.dto';
import { RoleChangeInterceptor } from '../../auth/interceptors/role-change.interceptor';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';
import { JwtAuthGuard } from '../../auth/passport/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(RoleChangeInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const users = await this.userService.findAll();
    return new ApiResponse<User[]>(users);
  }

  @Get('paginated')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get paginated users (Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for name or email',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by role' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'suspended'],
    description: 'Filter by status',
  })
  async getPaginatedUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: string,
  ): Promise<ApiResponse<{ users: User[]; total: number; totalPages: number }>> {
    const result = await this.userService.findPaginated(+page, +limit, search, role, status);
    return new ApiResponse<{ users: User[]; total: number; totalPages: number }>(result);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUserById(@Param('id') id: string): Promise<ApiResponse<User>> {
    const user = await this.userService.findById(id);
    return new ApiResponse<User>(user);
  }

  @Post(':id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID to suspend' })
  async suspendUser(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<User>> {
    if (req.user.sub === id) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    const user = await this.userService.suspendUser(id);
    return new ApiResponse<User>(user);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID to activate' })
  async activateUser(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<User>> {
    if (req.user.sub === id) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    const user = await this.userService.activateUser(id);
    return new ApiResponse<User>(user);
  }

  @Post(':id/change-role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID to change role' })
  @ApiBody({ type: ChangeRoleRequest })
  async changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleRequest: ChangeRoleRequest,
    @Request() req: any,
  ): Promise<ApiResponse<User>> {
    if (req.user.sub === id) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    const user = await this.userService.changeUserRole(id, changeRoleRequest.role);
    return new ApiResponse<User>(user);
  }

  @Delete(':id/delete-account')
  @ApiOperation({ summary: 'Soft delete user account' })
  @ApiParam({ name: 'id', description: 'User ID to delete' })
  @UseGuards(JwtAuthGuard)
  async softDeleteAccount(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<User>> {
    console.log('Delete account request:', { userId: id, reqUser: req.user });
  

    const user = await this.userService.softDeleteAccount(id);
    return new ApiResponse<User>(user);
  }
}
