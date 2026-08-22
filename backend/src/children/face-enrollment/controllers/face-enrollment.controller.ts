import {
  Controller,
  Post,
  Body,
  Param,
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
import { ChildFaceEnrollmentService } from '../child-face-enrollment.service';
import { StartEnrollmentResponseDto } from '../dto/start-enrollment.dto';
import { ProcessFrameDto, ProcessFrameResponseDto } from '../dto/process-frame.dto';
import { CompleteEnrollmentDto, CompleteEnrollmentResponseDto } from '../dto/complete-enrollment.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { JwtPayload } from '../../../auth/interfaces/jwt-payload.interface';

@ApiTags('Children Face Enrollment')
@ApiBearerAuth()
@Controller('children')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaceEnrollmentController {
  constructor(private readonly faceEnrollmentService: ChildFaceEnrollmentService) {}

  @Post(':childId/face-enrollment/start')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize live camera AI Face Enrollment session for a child' })
  @ApiResponse({ status: 200, type: StartEnrollmentResponseDto })
  @ApiResponse({ status: 404, description: 'Child not found' })
  async startEnrollment(
    @Param('childId') childId: string
  ): Promise<StartEnrollmentResponseDto> {
    return this.faceEnrollmentService.startEnrollment(childId);
  }

  @Post(':childId/face-enrollment/process-frame')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate single live camera frame for quality, centering & lighting' })
  @ApiResponse({ status: 200, type: ProcessFrameResponseDto })
  async processFrame(
    @Param('childId') childId: string,
    @Body() dto: ProcessFrameDto
  ): Promise<ProcessFrameResponseDto> {
    dto.childId = childId;
    return this.faceEnrollmentService.processFrame(dto);
  }

  @Post(':childId/face-enrollment/complete')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize multi-pose AI Face Enrollment, vector generation & duplicate check' })
  @ApiResponse({ status: 200, type: CompleteEnrollmentResponseDto })
  @ApiResponse({ status: 400, description: 'Missing required poses or invalid frames' })
  @ApiResponse({ status: 409, description: 'Possible duplicate child detected' })
  async completeEnrollment(
    @Param('childId') childId: string,
    @Body() dto: CompleteEnrollmentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request
  ): Promise<CompleteEnrollmentResponseDto> {
    console.log('[FaceEnrollmentController] === ENTERING CONTROLLER ===');
    console.log('[FaceEnrollmentController] Param childId:', childId);
    console.log('[FaceEnrollmentController] Validated DTO. capturedFrames length:', dto?.capturedFrames?.length);
    console.log('[FaceEnrollmentController] User sub:', user?.sub);

    dto.childId = childId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
      const result = await this.faceEnrollmentService.completeEnrollment(
        dto,
        user.sub,
        ipAddress,
        userAgent
      );
      console.log('[FaceEnrollmentController] === EXITING CONTROLLER SUCCESS ===');
      return result;
    } catch (error: any) {
      console.error('[FaceEnrollmentController] === EXCEPTION IN CONTROLLER ===');
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error meta:', error?.meta);
      console.error('Stack trace:', error?.stack);
      throw error;
    }
  }
}
