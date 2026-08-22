import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ChildWellnessService } from '../child-wellness.service';
import { AnalyzeWellnessDto, AnalyzeWellnessResponseDto } from '../dto/analyze-wellness.dto';
import { WellnessAlertItemDto, ResolveWellnessAlertDto } from '../dto/wellness-alert.dto';
import { IWellnessSummaryReport } from '../interfaces/child-wellness.interface';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { JwtPayload } from '../../../auth/interfaces/jwt-payload.interface';

@ApiTags('Children AI Wellness Monitoring')
@ApiBearerAuth()
@Controller('children/wellness')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WellnessController {
  constructor(private readonly wellnessService: ChildWellnessService) {}

  @Post('analyze')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze child facial expression & calculate daily wellness score' })
  @ApiResponse({ status: 200, type: AnalyzeWellnessResponseDto })
  async analyzeWellness(
    @Body() dto: AnalyzeWellnessDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request
  ): Promise<AnalyzeWellnessResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.wellnessService.analyzeChildWellness(dto, user.sub, ipAddress);
  }

  @Get('alerts')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get active open wellness alerts requiring attention' })
  @ApiResponse({ status: 200, type: [WellnessAlertItemDto] })
  async getWellnessAlerts(): Promise<WellnessAlertItemDto[]> {
    return this.wellnessService.getWellnessAlerts();
  }

  @Patch('alerts/resolve')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a wellness alert (Admin only)' })
  @ApiResponse({ status: 200, description: 'Wellness alert resolved successfully' })
  async resolveAlert(
    @Body() dto: ResolveWellnessAlertDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request
  ): Promise<{ statusCode: number; message: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.wellnessService.resolveWellnessAlert(dto, user.sub, ipAddress);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get today wellness summary report for an orphanage' })
  async getSummary(
    @Query('orphanageId') orphanageId: string
  ): Promise<IWellnessSummaryReport> {
    return this.wellnessService.getTodayWellnessSummary(orphanageId);
  }
}
