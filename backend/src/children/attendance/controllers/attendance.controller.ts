import {
  Controller,
  Post,
  Get,
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
import { AttendanceSessionService } from '../services/attendance-session.service';
import {
  StartAttendanceSessionDto,
  SessionActionDto,
  AttendanceSessionStatusResponseDto,
} from '../dto/attendance-session.dto';
import {
  RecognizeAttendanceFrameDto,
  RecognizeAttendanceFrameResponseDto,
} from '../dto/recognize-frame.dto';
import { AttendanceSummaryResponseDto } from '../dto/attendance-summary.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { JwtPayload } from '../../../auth/interfaces/jwt-payload.interface';

@ApiTags('Children AI Attendance')
@ApiBearerAuth()
@Controller('children/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceSessionService: AttendanceSessionService) {}

  @Post('session/start')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a live camera AI Attendance session for an orphanage' })
  @ApiResponse({ status: 200, type: AttendanceSessionStatusResponseDto })
  @ApiResponse({ status: 409, description: 'An active session is already running for this orphanage' })
  async startSession(
    @Body() dto: StartAttendanceSessionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request
  ): Promise<AttendanceSessionStatusResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.attendanceSessionService.startSession(dto, user.sub, user.role, ipAddress);
  }

  @Post('session/pause')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an active attendance session' })
  @ApiResponse({ status: 200, type: AttendanceSessionStatusResponseDto })
  async pauseSession(
    @Query('orphanageId') orphanageId: string,
    @CurrentUser() user: JwtPayload
  ): Promise<AttendanceSessionStatusResponseDto> {
    return this.attendanceSessionService.pauseSession(orphanageId, user.sub);
  }

  @Post('session/resume')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused attendance session' })
  @ApiResponse({ status: 200, type: AttendanceSessionStatusResponseDto })
  async resumeSession(
    @Query('orphanageId') orphanageId: string,
    @CurrentUser() user: JwtPayload
  ): Promise<AttendanceSessionStatusResponseDto> {
    return this.attendanceSessionService.resumeSession(orphanageId, user.sub);
  }

  @Get('session/status')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get current active attendance session status for an orphanage' })
  @ApiResponse({ status: 200, type: AttendanceSessionStatusResponseDto })
  async getStatus(
    @Query('orphanageId') orphanageId: string
  ): Promise<AttendanceSessionStatusResponseDto> {
    return this.attendanceSessionService.getSessionStatus(orphanageId);
  }

  @Get('dashboard/metrics')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get real-time AI Attendance dashboard metrics' })
  async getMetrics(
    @Query('orphanageId') orphanageId: string
  ): Promise<any> {
    return this.attendanceSessionService.getActiveSessionMetrics(orphanageId);
  }

  @Post('recognize-frame')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process live camera frame for biometric face recognition & auto-checkin' })
  @ApiResponse({ status: 200, type: RecognizeAttendanceFrameResponseDto })
  async recognizeFrame(
    @Body() dto: RecognizeAttendanceFrameDto,
    @CurrentUser() user: JwtPayload
  ): Promise<RecognizeAttendanceFrameResponseDto> {
    return this.attendanceSessionService.processRecognizeFrame(dto, user.sub, user.role);
  }

  @Post('session/end')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End attendance session, run absent detection & generate summary' })
  @ApiResponse({ status: 200, type: AttendanceSummaryResponseDto })
  async endSession(
    @Body() dto: SessionActionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request
  ): Promise<AttendanceSummaryResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.attendanceSessionService.endSession(dto.sessionId, user.sub, ipAddress);
  }

  @Get('manual-verification/queue')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get pending manual verification queue cases' })
  async getManualQueue(@Query('orphanageId') orphanageId: string): Promise<any> {
    return this.attendanceSessionService.getManualVerificationQueue(orphanageId);
  }

  @Post('manual-verification/review')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm or reject suggested child identity in manual verification queue' })
  async reviewManualQueue(
    @Body() body: { queueId: string; approved: boolean; notes?: string },
    @CurrentUser() user: JwtPayload
  ): Promise<any> {
    return this.attendanceSessionService.reviewManualVerification(body.queueId, body.approved, body.notes || '', user.sub);
  }

  @Get('unknown-events')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get unknown face events' })
  async getUnknownEvents(@Query('orphanageId') orphanageId: string): Promise<any> {
    return this.attendanceSessionService.getUnknownFaceEvents(orphanageId);
  }

  @Post('unknown-events/resolve')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve an unknown face event (Admin only)' })
  async resolveUnknownEvent(
    @Body() body: { eventId: string; notes?: string },
    @CurrentUser() user: JwtPayload
  ): Promise<any> {
    return this.attendanceSessionService.resolveUnknownFaceEvent(body.eventId, body.notes || '', user.sub);
  }

  @Get('history')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get historical attendance sessions & summaries' })
  async getHistory(@Query('orphanageId') orphanageId: string): Promise<any> {
    return this.attendanceSessionService.getAttendanceHistory(orphanageId);
  }
}
