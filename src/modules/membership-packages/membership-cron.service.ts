import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserMembershipService } from '../user-memberships/user-membership.service';

@Injectable()
export class MembershipCronService {
  private readonly logger = new Logger(MembershipCronService.name);

  constructor(
    private readonly userMembershipService: UserMembershipService,
  ) {}

  /**
   * Cron job runs every day at 00:00 to check and handle expired memberships
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredMemberships() {
    this.logger.log('Starting daily membership expiration check...');
    
    try {
      // Mark expired memberships as expired
      const expiredCount = await this.userMembershipService.markExpiredMemberships();
      this.logger.log(`Marked ${expiredCount} memberships as expired`);

      // Optionally, clean up old expired memberships (older than 30 days)
      const deletedCount = await this.userMembershipService.deleteExpiredMemberships();
      this.logger.log(`Deleted ${deletedCount} old expired memberships`);

      this.logger.log('Daily membership expiration check completed successfully');
    } catch (error) {
      this.logger.error('Error during membership expiration check:', error);
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerMembershipCheck() {
    this.logger.log('Manual membership check triggered');
    await this.handleExpiredMemberships();
  }
}