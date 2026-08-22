import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
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
import { AdminStaffService } from './admin-staff.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  QueryStaffDto,
  StaffListResponseDto,
  StaffProfileDto,
  CreateStaffResponseDto,
} from '../staff/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Admin Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/staff')
export class AdminStaffController {
  constructor(private readonly adminStaffService: AdminStaffService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new System/Admin staff member' })
  @ApiResponse({
    status: 201,
    description: 'Admin staff member created successfully',
    type: CreateStaffResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({ type: CreateStaffDto })
  create(
    @Body() createStaffDto: CreateStaffDto,
    @CurrentUser('sub') userId: string,
  ): Promise<CreateStaffResponseDto> {
    return this.adminStaffService.createAdminStaff(createStaffDto, userId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all system/admin staff members' })
  @ApiResponse({
    status: 200,
    description: 'Admin staff list retrieved successfully',
    type: StaffListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() queryDto: QueryStaffDto): Promise<StaffListResponseDto> {
    return this.adminStaffService.findAllAdminStaff(queryDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin staff profile by ID' })
  @ApiResponse({ status: 200, type: StaffProfileDto })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  findOne(@Param('id') id: string): Promise<StaffProfileDto> {
    return this.adminStaffService.findOneAdminStaff(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update admin staff member' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ): Promise<void> {
    return this.adminStaffService.updateAdminStaff(id, updateStaffDto);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate admin staff member' })
  @ApiResponse({ status: 200 })
  deactivate(@Param('id') id: string): Promise<void> {
    return this.adminStaffService.deleteAdminStaff(id);
  }

  @Patch(':id/reactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reactivate admin staff member' })
  @ApiResponse({ status: 200 })
  reactivate(@Param('id') id: string): Promise<void> {
    return this.adminStaffService.reactivateAdminStaff(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete or deactivate admin staff member' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string): Promise<void> {
    return this.adminStaffService.deleteAdminStaff(id);
  }
}
