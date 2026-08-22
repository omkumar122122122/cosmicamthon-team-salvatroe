import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

import { PostAdoptionMonitoringService } from './post-adoption-monitoring.service';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { UploadFaceDto } from './dto/upload-face.dto';
import { UploadVoiceDto } from './dto/upload-voice.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@ApiTags('Post Adoption Monitoring')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('post-adoption')
export class PostAdoptionMonitoringController {
  constructor(
    private readonly monitoringService: PostAdoptionMonitoringService,
  ) {}

  @Get('schedule')
  @Roles(Role.PARENT, Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @ApiOperation({ summary: 'Get 6-month post-adoption assessment schedule' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  getSchedule(
    @Query() query: QueryScheduleDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    return this.monitoringService.getSchedule(userId, userRole, query);
  }

  @Post('start')
  @Roles(Role.PARENT, Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start/initialize a new assessment session for an adopted child' })
  @ApiResponse({ status: 201, description: 'Assessment session initialized' })
  startAssessment(
    @Body() dto: StartAssessmentDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    return this.monitoringService.startAssessment(userId, userRole, dto);
  }

  @Get('questions/:childId')
  @Roles(Role.PARENT, Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @ApiOperation({ summary: 'Get age-tailored assessment questions for child' })
  @ApiResponse({ status: 200, description: 'Questions retrieved' })
  getQuestions(@Param('childId') childId: string) {
    return this.monitoringService.getQuestions(childId);
  }

  @Post('upload-face')
  @Roles(Role.PARENT, Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process facial expression analysis for child assessment' })
  @ApiResponse({ status: 200, description: 'Face analysis completed' })
  uploadFace(@Body() dto: UploadFaceDto) {
    return this.monitoringService.uploadFace(dto);
  }

  @Post('upload-voice')
  @Roles(Role.PARENT, Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process audio/voice sentiment analysis for child assessment' })
  @ApiResponse({ status: 200, description: 'Voice analysis completed' })
  uploadVoice(@Body() dto: UploadVoiceDto) {
    return this.monitoringService.uploadVoice(dto);
  }

  @Post('submit')
  @Roles(Role.PARENT, Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit completed assessment and compute overall risk & scores' })
  @ApiResponse({ status: 200, description: 'Assessment submitted successfully' })
  submitAssessment(@Body() dto: SubmitAssessmentDto) {
    return this.monitoringService.submitAssessment(dto);
  }

  @Get('report/:id')
  @Roles(Role.PARENT, Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @ApiOperation({ summary: 'Get complete post-adoption assessment report by ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  getReport(@Param('id') id: string) {
    return this.monitoringService.getReport(id);
  }
}
