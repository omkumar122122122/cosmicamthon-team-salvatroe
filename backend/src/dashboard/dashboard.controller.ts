import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  AdminStatsDto,
  AdminChartsDto,
  RecentChildrenDto,
} from './dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get Admin Dashboard Statistics (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard statistics retrieved successfully',
    type: AdminStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  getAdminStats(): Promise<AdminStatsDto> {
    return this.dashboardService.getAdminStats();
  }

  @Get('admin/charts')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get Admin Dashboard Charts Data (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard charts retrieved successfully',
    type: AdminChartsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  getAdminCharts(): Promise<AdminChartsDto> {
    return this.dashboardService.getAdminCharts();
  }

  @Get('admin/recent-children')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get Recent Children for Admin Dashboard (ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent children retrieved successfully',
    type: RecentChildrenDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  getRecentChildren(): Promise<RecentChildrenDto> {
    return this.dashboardService.getRecentChildren();
  }
}
