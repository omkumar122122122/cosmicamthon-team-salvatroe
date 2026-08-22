import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { OrphanageStaffController } from './orphanage-staff.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffController, OrphanageStaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
