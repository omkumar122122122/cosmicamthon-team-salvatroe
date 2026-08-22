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
import { StaffService } from './staff.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  QueryStaffDto,
  StaffListResponseDto,
  StaffProfileDto,
  StaffBasicDto,
  CreateStaffResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new staff member' })
  @ApiResponse({
    status: 201,
    description: 'Staff member created successfully',
    type: CreateStaffResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User or Orphanage not found' })
  @ApiResponse({ status: 409, description: 'Staff member already exists' })
  @ApiBody({ type: CreateStaffDto })
  create(
    @Body() createStaffDto: CreateStaffDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('orphanageId') userOrphanageId?: string,
  ): Promise<CreateStaffResponseDto> {
    return this.staffService.create(createStaffDto, userId, userRole, userOrphanageId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get all staff with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Staff list retrieved successfully',
    type: StaffListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Query() queryDto: QueryStaffDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<StaffListResponseDto> {
    return this.staffService.findAll(queryDto, userId, userRole);
  }

  @Get('available/:orphanageId')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({
    summary: 'Get available (active) staff for a specific orphanage',
  })
  @ApiResponse({
    status: 200,
    description: 'Available staff retrieved successfully',
    type: [StaffBasicDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getAvailable(
    @Param('orphanageId') orphanageId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<StaffBasicDto[]> {
    return this.staffService.getAvailableStaff(orphanageId, userId, userRole);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get staff member profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff profile retrieved successfully',
    type: StaffProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<StaffProfileDto> {
    return this.staffService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update staff member information' })
  @ApiResponse({
    status: 200,
    description: 'Staff member updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiBody({ type: UpdateStaffDto })
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    await this.staffService.update(id, updateStaffDto, userId, userRole);
    return { message: 'Staff member updated successfully' };
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate staff member (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Staff member deactivated successfully',
  })
  @ApiResponse({ status: 400, description: 'Staff member already deactivated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    await this.staffService.deactivate(id, userId, userRole);
    return { message: 'Staff member deactivated successfully' };
  }

  @Patch(':id/reactivate')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate staff member' })
  @ApiResponse({
    status: 200,
    description: 'Staff member reactivated successfully',
  })
  @ApiResponse({ status: 400, description: 'Staff member already active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async reactivate(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    await this.staffService.reactivate(id, userId, userRole);
    return { message: 'Staff member reactivated successfully' };
  }
}
