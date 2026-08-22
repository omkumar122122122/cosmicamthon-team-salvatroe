import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

import { ChildProfileManagementService } from '../services/child-profile-management.service';
import { ChildSearchFilterService, IChildQueryDto } from '../services/child-search-filter.service';
import { ChildActivityTimelineService } from '../services/child-activity-timeline.service';
import { ChildTransferManagementService } from '../services/child-transfer-management.service';
import { ChildAnalyticsService } from '../services/child-analytics.service';

import { UpdateChildProfileDto } from '../dto/update-child-profile.dto';
import {
  RequestChildTransferDto,
  ReviewTransferRequestDto,
  AddChildDocumentDto,
} from '../dto/transfer-child.dto';

@ApiTags('Child Management Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('children')
export class ChildManagementController {
  constructor(
    private readonly profileService: ChildProfileManagementService,
    private readonly searchFilterService: ChildSearchFilterService,
    private readonly timelineService: ChildActivityTimelineService,
    private readonly transferService: ChildTransferManagementService,
    private readonly analyticsService: ChildAnalyticsService
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @ApiOperation({ summary: 'Advanced Search & Filter Children' })
  async searchAndFilterChildren(@Query() query: IChildQueryDto) {
    return this.searchFilterService.searchAndFilterChildren(query);
  }

  @Get('analytics/summary')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Child Demographic & Health Analytics Summary' })
  async getAnalyticsSummary(@Query('orphanageId') orphanageId?: string) {
    return this.analyticsService.getChildAnalyticsSummary(orphanageId);
  }

  @Get('transfers/pending')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get Pending Child Inter-Orphanage Transfers' })
  async getPendingTransfers() {
    return this.transferService.getPendingTransfers();
  }

  @Get(':id/profile')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @ApiOperation({ summary: 'Get Comprehensive Child Profile' })
  async getChildProfile(@Param('id') id: string) {
    return this.profileService.getChildProfile(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Update Child Editable Information (Preserves Biometrics & ChildCode)' })
  async updateChildProfile(
    @Param('id') id: string,
    @Body() dto: UpdateChildProfileDto,
    @Req() req: any,
    @Ip() ipAddress: string
  ) {
    const userId = req.user?.id || 'admin-user';
    const userRole = req.user?.role || Role.ADMIN;
    return this.profileService.updateChildProfile(id, dto, userId, userRole, ipAddress);
  }

  @Delete(':id/archive')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft Archive Child Record' })
  async softArchiveChild(
    @Param('id') id: string,
    @Query('reason') reason: string,
    @Req() req: any,
    @Ip() ipAddress: string
  ) {
    const userId = req.user?.id || 'admin-user';
    return this.profileService.softArchiveChild(id, reason || 'Administrative Archival', userId, ipAddress);
  }

  @Get(':id/timeline')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @ApiOperation({ summary: 'Get Chronological Child Activity History' })
  async getChildTimeline(@Param('id') id: string) {
    return this.timelineService.getChildTimeline(id);
  }

  @Post(':id/transfer/request')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Initiate Child Inter-Orphanage Transfer Request' })
  async requestTransfer(
    @Param('id') id: string,
    @Body() dto: RequestChildTransferDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'staff-user';
    return this.transferService.requestTransfer(id, dto, userId);
  }

  @Post('transfer/:transferId/approve')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin Approve Child Inter-Orphanage Transfer' })
  async approveTransfer(
    @Param('transferId') transferId: string,
    @Body('notes') notes: string,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'admin-user';
    return this.transferService.approveTransfer(transferId, userId, notes);
  }

  @Post('transfer/:transferId/reject')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin Reject Child Inter-Orphanage Transfer' })
  async rejectTransfer(
    @Param('transferId') transferId: string,
    @Body('notes') notes: string,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'admin-user';
    return this.transferService.rejectTransfer(transferId, userId, notes);
  }

  @Post(':id/documents')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Add Child Verified Document' })
  async addChildDocument(
    @Param('id') id: string,
    @Body() dto: AddChildDocumentDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'staff-user';
    return this.profileService.addChildDocument(id, dto, userId);
  }
}
