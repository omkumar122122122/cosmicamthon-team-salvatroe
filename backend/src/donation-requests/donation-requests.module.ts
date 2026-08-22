import { Module } from '@nestjs/common';
import { DonationRequestsController } from './donation-requests.controller';
import { DonationRequestsService } from './donation-requests.service';

@Module({
  controllers: [DonationRequestsController],
  providers: [DonationRequestsService],
  exports: [DonationRequestsService],
})
export class DonationRequestsModule {}
