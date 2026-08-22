import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─────────────────────────────────────────────
  // Admin — List all users
  // ─────────────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @ApiOperation({
    summary: 'List all users (paginated)',
    description: 'Returns a paginated list of users with optional filtering. Requires ADMIN, ORPHANAGE, or SOCIAL_WORKER role.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.usersService.findAll({ page, limit, role, search, isActive });
  }

  // ─────────────────────────────────────────────
  // Admin — Stats
  // ─────────────────────────────────────────────

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getStats() {
    return this.usersService.getStats();
  }

  // ─────────────────────────────────────────────
  // Get user by ID
  // ─────────────────────────────────────────────

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.SOCIAL_WORKER)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  // ─────────────────────────────────────────────
  // Update own profile
  // ─────────────────────────────────────────────

  @Patch('me')
  @ApiOperation({
    summary: 'Update own profile',
    description: 'Updates the authenticated user\'s profile (name, phone, avatar).',
  })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  // ─────────────────────────────────────────────
  // Admin — Update role
  // ─────────────────────────────────────────────

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Update user role' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateRole(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('sub') requestingUserId: string,
  ) {
    return this.usersService.updateRole(targetId, dto, requestingUserId);
  }

  // ─────────────────────────────────────────────
  // Admin — Activate / Deactivate
  // ─────────────────────────────────────────────

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Activate or deactivate user account' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateStatus(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(targetId, dto);
  }

  // ─────────────────────────────────────────────
  // Admin — Soft delete
  // ─────────────────────────────────────────────

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Soft-delete user account' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden — cannot delete own account' })
  softDelete(
    @Param('id', ParseUUIDPipe) targetId: string,
    @CurrentUser('sub') requestingUserId: string,
  ) {
    return this.usersService.softDelete(targetId, requestingUserId);
  }
}
