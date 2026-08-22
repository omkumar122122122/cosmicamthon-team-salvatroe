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

@ApiTags('Orphanage Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orphanage/staff')
export class OrphanageStaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new Orphanage staff member' })
  @ApiResponse({
    status: 201,
    description: 'Orphanage staff member created successfully',
    type: CreateStaffResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({ type: CreateStaffDto })
  create(
    @Body() createStaffDto: CreateStaffDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('orphanageId') userOrphanageId?: string,
  ): Promise<CreateStaffResponseDto> {
    return this.staffService.createOrphanageStaff(
      createStaffDto,
      userId,
      userRole,
      userOrphanageId,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get orphanage staff members' })
  @ApiResponse({
    status: 200,
    description: 'Orphanage staff list retrieved successfully',
    type: StaffListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Query() queryDto: QueryStaffDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('orphanageId') userOrphanageId?: string,
  ): Promise<StaffListResponseDto> {
    return this.staffService.findAllOrphanageStaff(
      queryDto,
      userId,
      userRole,
      userOrphanageId,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get orphanage staff profile by ID' })
  @ApiResponse({ status: 200, type: StaffProfileDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<StaffProfileDto> {
    return this.staffService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Update orphanage staff member' })
  update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<void> {
    return this.staffService.update(id, updateStaffDto, userId, userRole);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Deactivate orphanage staff member' })
  deactivate(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<void> {
    return this.staffService.deactivate(id, userId, userRole);
  }

  @Patch(':id/reactivate')
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Reactivate orphanage staff member' })
  reactivate(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<void> {
    return this.staffService.reactivate(id, userId, userRole);
  }
}
