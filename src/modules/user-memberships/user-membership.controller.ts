import { Controller, Get, Param, UseGuards, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/passport/jwt-auth.guard';
import { UserMembershipService } from './user-membership.service';
import { ApiResponse } from '../../common/api-response';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';
import { Public } from 'src/auth/decorator/customize';

@ApiTags('User Memberships')
@Controller('user-memberships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserMembershipController {
  constructor(private readonly userMembershipService: UserMembershipService) {}

  /**
   * Get user's active membership with full details
   * Returns membership level and benefits
   * @param userId - User ID to get membership for
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user membership details' })
  async getUserMembership(@Param('userId') userId: string) {
    try {
      const membership = await this.userMembershipService.getActiveMembership(userId);
      
      if (!membership) {
        // User has no active membership - return Free tier (level -1)
        return new ApiResponse({
          level: -1,
          name: 'FREE',
          user_id: userId,
          status: 'active',
          benefits: {
            marketplace_sell_limit: 0,
            marketplace_buy_limit: 3,
            marketplace_discount: 0,
            priority_listing: false,
          }
        });
      }

      const membershipPackage = membership.package_id as any;
      
      // Map membership level to benefits
      const benefits = this.getMembershipBenefits(membershipPackage.level);

      return new ApiResponse({
        _id: membership._id.toString(),
        user_id: membership.user_id.toString(),
        package_id: membership.package_id.toString(),
        level: membershipPackage.level,
        name: membershipPackage.name,
        start_date: membership.start_date,
        end_date: membership.end_date,
        status: membership.status,
        benefits,
      });
    } catch (error) {
      console.error('Error getting user membership:', error);
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get membership level only (faster endpoint for quick checks)
   * @param userId - User ID
   */
  @Get('user/:userId/level')
  @Public()
  @ApiOperation({ summary: 'Get user membership level' })
  async getUserMembershipLevel(@Param('userId') userId: string) {
    try {
      const level = await this.userMembershipService.getUserMembershipLevel(userId);
      
      // If no membership, return Free tier (level -1)
      const actualLevel = level === 0 && !(await this.userMembershipService.hasActiveMembership(userId)) 
        ? -1 
        : level;

      return new ApiResponse({
        user_id: userId,
        level: actualLevel,
        benefits: this.getMembershipBenefits(actualLevel),
      });
    } catch (error) {
      console.error('Error getting user membership level:', error);
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Helper function to map membership level to benefits
   * Level -1: FREE (no membership)
   * Level 0: BASIC
   * Level 1: PLUS
   * Level 2: PREMIUM (BUSINESS)
   */
  private getMembershipBenefits(level: number) {
    switch (level) {
      case -1: // FREE
        return {
          marketplace_sell_limit: 0, // Không được bán
          marketplace_buy_limit: 3, // Tối đa 3 lần mua miễn phí
          marketplace_discount: 0, // Không giảm giá
          priority_listing: false,
        };
      case 0: // BASIC
        return {
          marketplace_sell_limit: 0, // Không được bán
          marketplace_buy_limit: 10, // Tối đa 10 lần mua/tháng
          marketplace_discount: 0.1, // Giảm 10%
          priority_listing: false,
        };
      case 1: // PLUS
        return {
          marketplace_sell_limit: 3, // Bán tối đa 3 flashcard/tháng
          marketplace_buy_limit: -1, // Không giới hạn
          marketplace_discount: 0.25, // Giảm 25%
          priority_listing: false,
        };
      case 2: // PREMIUM (BUSINESS)
        return {
          marketplace_sell_limit: -1, // Không giới hạn
          marketplace_buy_limit: -1, // Không giới hạn
          marketplace_discount: 0.3, // Giảm 30%
          priority_listing: true, // Ưu tiên hiển thị
        };
      default:
        return {
          marketplace_sell_limit: 0,
          marketplace_buy_limit: 3,
          marketplace_discount: 0,
          priority_listing: false,
        };
    }
  }

  @Post('update')
  @Public()
  async updateMembership(
    @Body() body: { packageId: string; userId: string },
    @Req() req: any,
  ) {
    if (!body.userId || !body.packageId) {
      throw new AppException(ErrorCode.NOT_FOUND);
    }

    const result = await this.userMembershipService.updateMembership(
      body.userId,
      body.packageId,
    );

    return {
      data: {
        membership: result.membership,
        package: result.package,
      },
      message: 'Membership updated successfully',
      statusCode: 200,
    };
  }
}
