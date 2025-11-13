import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/passport/jwt-auth.guard';
import { RolesGuard } from '../../auth/passport/roles.guard';
import { Public, Roles } from '../../auth/decorator/customize';
import { UserRole } from '../users/user.schema';
import { MembershipPackageService } from './membership-package.service';
import { UserMembershipService } from '../user-memberships/user-membership.service';
import { CreateMembershipPackageDto, UpdateMembershipPackageDto } from './dto/membership-package.dto';
import { ApiResponse } from '../../common/api-response';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

@ApiTags('Membership Packages')
@Controller('membership-packages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MembershipPackageController {
  constructor(
    private readonly membershipPackageService: MembershipPackageService,
    private readonly userMembershipService: UserMembershipService,
  ) {}

  /**
   * Create a new membership package (Admin only)
   * @param dto - Package details
   * @param req - Express request with user info
   */
  @Post()
  async createMembershipPackage(
    @Body() dto: CreateMembershipPackageDto,
    @Request() req: any,
  ) {
    // Check if user is admin
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AppException(ErrorCode.ADMIN_REQUIRED);
    }

    try {
        console.log('-1. In controller, creating membership package with dto:', dto);
    const package_ = await this.membershipPackageService.createMembershipPackage(dto);

    return new ApiResponse(
      package_,
    );
    } catch (error) {
        console.error('Failed to create membership package:', error);
        // throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
        throw error;
        }

  }

  /**
   * Get all active membership packages
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get all active membership packages' })
  async getAllMembershipPackages(@Request() req: any) {
    const packages = await this.membershipPackageService.getAllMembershipPackages();

    // Resolve current user's membership level via service
    const user = req?.user;
    const currentLevel: number = await this.userMembershipService.getUserMembershipLevel(
      user?.user_id,
    );
    console.log('Current user membership level:', currentLevel);
    // Mark packages that are NOT available (levels lower than user's current level)
    const enriched = (packages || []).map((pkg: any) => {
      const level = typeof pkg?.level === 'string' ? parseInt(pkg.level, 10) : Number(pkg?.level);
      const disabled = !isNaN(level) ? level < currentLevel : false;
      return { ...pkg, disabled };
    });

    return new ApiResponse(enriched);
  }

  /**
   * Get membership package by ID
   */
  @Get('by-id/:packageId')
  @Public()
  @ApiOperation({ summary: 'Get membership package by ID' })
  async getMembershipPackageById(
    @Param('packageId') packageId: string,
    @Request() req: any,
  ) {
    const package_ = await this.membershipPackageService.getMembershipPackageById(packageId);

    return new ApiResponse(package_);
  }

  /**
   * Get membership packages by list of IDs
   */
  @Post('by-ids')
  @Public()
  @ApiOperation({ summary: 'Get membership packages by list of IDs' })
  async getMembershipPackagesByIds(
    @Body() body: { packageIds: string[] },
    @Request() req: any,
  ) {
    const packages = await this.membershipPackageService.getMembershipPackagesByIds(body.packageIds);

    return new ApiResponse(packages);
  }

  /**
   * Get membership package by level
   * @param level - Package level (0, 1, 2)
   */
  @Get(':level')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get membership package by level' })
  async getMembershipPackageByLevel(
    @Param('level') level: string,
    @Request() req: any,
  ) {
    const levelNum = parseInt(level, 10);

    if (isNaN(levelNum) || levelNum < 0 || levelNum > 2) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    const package_ = await this.membershipPackageService.getMembershipPackageByLevel(levelNum);

    return new ApiResponse(package_);
  }

  /**
   * Update membership package (Admin only)
   * @param level - Package level to update
   * @param dto - Updated package details
   */
  @Patch(':level')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update membership package (Admin only)' })
  async updateMembershipPackage(
    @Param('level') level: string,
    @Body() dto: UpdateMembershipPackageDto,
    @Request() req: any,
  ) {
    // Check if user is admin
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AppException(ErrorCode.ADMIN_REQUIRED);
    }

    const levelNum = parseInt(level, 10);

    if (isNaN(levelNum) || levelNum < 0 || levelNum > 2) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    const updatedPackage = await this.membershipPackageService.updateMembershipPackage(
      levelNum,
      dto,
    );

    return new ApiResponse(updatedPackage);
  }

  /**
   * Deactivate membership package (Admin only)
   * @param level - Package level to deactivate
   */
  @Delete(':level')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate membership package (Admin only)' })
  async deactivateMembershipPackage(
    @Param('level') level: string,
    @Request() req: any,
  ) {
    // Check if user is admin
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AppException(ErrorCode.ADMIN_REQUIRED);
    }

    const levelNum = parseInt(level, 10);

    if (isNaN(levelNum) || levelNum < 0 || levelNum > 2) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    const deactivatedPackage = await this.membershipPackageService.deactivateMembershipPackage(
      levelNum,
    );

    return new ApiResponse(deactivatedPackage);
  }
}
