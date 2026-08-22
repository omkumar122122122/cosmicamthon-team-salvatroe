import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { VisitRequestsService } from './visit-requests.service';
import {
  CreateVisitRequestDto,
  QueryVisitRequestDto,
  ApproveVisitRequestDto,
  RejectVisitRequestDto,
  RescheduleVisitRequestDto,
  RequestDocumentsDto,
  CompleteVisitDto,
  CancelVisitRequestDto,
  RespondRescheduleDto,
  NoShowVisitDto,
  VisitRequestResponseDto,
  VisitRequestListResponseDto,
  VisitRequestListItemDto,
  VisitRequestSummaryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Visit Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visit-requests')
export class VisitRequestsController {
  constructor(private readonly visitRequestsService: VisitRequestsService) {}

  @Post()
  @Roles(Role.PARENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new visit request (PARENT only)' })
  @ApiResponse({
    status: 201,
    description: 'Visit request created successfully',
    type: VisitRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or KYC not completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Parent profile or orphanage not found' })
  @ApiBody({ type: CreateVisitRequestDto })
  create(
    @Body() createVisitRequestDto: CreateVisitRequestDto,
    @CurrentUser('sub') userId: string,
  ): Promise<VisitRequestResponseDto> {
    return this.visitRequestsService.create(createVisitRequestDto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({
    summary: 'Get all visit requests with filters (ORPHANAGE: own orphanage, ADMIN: all)',
  })
  @ApiResponse({
    status: 200,
    description: 'Visit requests retrieved successfully',
    type: VisitRequestListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query() queryDto: QueryVisitRequestDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<VisitRequestListResponseDto> {
    console.log('[VisitRequestsController] === ENTERING GET /visit-requests ===');
    console.log('[VisitRequestsController] Query DTO:', queryDto);
    console.log('[VisitRequestsController] User ID:', userId, 'Role:', userRole);

    try {
      const result = await this.visitRequestsService.findAll(queryDto, userId, userRole);
      console.log('[VisitRequestsController] === EXITING GET /visit-requests SUCCESS ===');
      return result;
    } catch (e: any) {
      console.error('[VisitRequestsController] === EXCEPTION IN GET /visit-requests ===');
      console.error(e);
      console.error('Code:', e?.code);
      console.error('Meta:', e?.meta);
      console.error('Stack:', e?.stack);
      throw e;
    }
  }

  @Get('my-requests')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Get logged-in parent\'s visit requests' })
  @ApiResponse({
    status: 200,
    description: 'Parent visit requests retrieved successfully',
    type: VisitRequestListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Parent profile not found' })
  getMyRequests(
    @Query() queryDto: QueryVisitRequestDto,
    @CurrentUser('sub') userId: string,
  ): Promise<VisitRequestListResponseDto> {
    return this.visitRequestsService.getMyRequests(queryDto, userId);
  }

  @Get('today')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get today\'s scheduled visits' })
  @ApiResponse({
    status: 200,
    description: 'Today\'s visits retrieved successfully',
    type: [VisitRequestListItemDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTodayVisits(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<VisitRequestListItemDto[]> {
    return this.visitRequestsService.getTodayVisits(userId, userRole);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get visit request summary statistics' })
  @ApiResponse({
    status: 200,
    description: 'Visit request statistics retrieved successfully',
    type: VisitRequestSummaryDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getStats(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<VisitRequestSummaryDto> {
    return this.visitRequestsService.getStats(userId, userRole);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT)
  @ApiOperation({ summary: 'Get visit request details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Visit request retrieved successfully',
    type: VisitRequestResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<VisitRequestResponseDto> {
    return this.visitRequestsService.findOne(id, userId, userRole);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a visit request' })
  @ApiResponse({ status: 200, description: 'Visit request approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or request cannot be approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  @ApiBody({ type: ApproveVisitRequestDto })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveVisitRequestDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.visitRequestsService.approve(id, approveDto, userId, userRole);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a visit request' })
  @ApiResponse({ status: 200, description: 'Visit request rejected successfully' })
  @ApiResponse({ status: 400, description: 'Request cannot be rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  @ApiBody({ type: RejectVisitRequestDto })
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectVisitRequestDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.visitRequestsService.reject(id, rejectDto, userId, userRole);
  }

  @Patch(':id/reschedule')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule a visit' })
  @ApiResponse({ status: 200, description: 'Visit rescheduled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or request cannot be rescheduled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  @ApiBody({ type: RescheduleVisitRequestDto })
  async reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleVisitRequestDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.visitRequestsService.reschedule(id, rescheduleDto, userId, userRole);
  }

  @Patch(':id/request-documents')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request additional documents from parent' })
  @ApiResponse({ status: 200, description: 'Document request sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  @ApiBody({ type: RequestDocumentsDto })
  async requestDocuments(
    @Param('id') id: string,
    @Body() requestDocsDto: RequestDocumentsDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.visitRequestsService.requestDocuments(id, requestDocsDto, userId, userRole);
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark visit as completed with feedback' })
  @ApiResponse({ status: 200, description: 'Visit completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or visit cannot be completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  @ApiBody({ type: CompleteVisitDto })
  async complete(
    @Param('id') id: string,
    @Body() completeDto: CompleteVisitDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.visitRequestsService.complete(id, completeDto, userId, userRole);
  }

  @Patch(':id/cancel')
  @Roles(Role.PARENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending visit request (PARENT only)' })
  @ApiResponse({ status: 200, description: 'Visit request cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Request cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your request' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  @ApiBody({ type: CancelVisitRequestDto })
  async cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelVisitRequestDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.visitRequestsService.cancel(id, cancelDto, userId);
  }

  @Patch(':id/respond-reschedule')
  @Roles(Role.PARENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to a proposed reschedule request (PARENT only)' })
  @ApiResponse({ status: 200, description: 'Reschedule response processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or request cannot be updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your request' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  @ApiBody({ type: RespondRescheduleDto })
  async respondReschedule(
    @Param('id') id: string,
    @Body() respondDto: RespondRescheduleDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.visitRequestsService.respondReschedule(id, respondDto, userId);
  }

  @Patch(':id/check-in')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in a parent on visit day' })
  @ApiResponse({ status: 200, description: 'Check in recorded successfully' })
  @ApiResponse({ status: 400, description: 'Request cannot be checked in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  async checkIn(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.visitRequestsService.checkIn(id, userId, userRole);
  }

  @Patch(':id/no-show')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark visit request as No Show' })
  @ApiResponse({ status: 200, description: 'No show recorded successfully' })
  @ApiResponse({ status: 400, description: 'Request status invalid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visit request not found' })
  @ApiBody({ type: NoShowVisitDto })
  async noShow(
    @Param('id') id: string,
    @Body() noShowDto: NoShowVisitDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.visitRequestsService.noShow(id, noShowDto, userId, userRole);
  }
}
