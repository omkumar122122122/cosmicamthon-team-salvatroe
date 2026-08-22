import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { OrphanagesService } from './orphanages.service';
import { CreateOrphanageDto } from './dto/create-orphanage.dto';
import { UpdateOrphanageDto } from './dto/update-orphanage.dto';
import { OrphanageQueryDto } from './dto/orphanage-query.dto';
import { NearbyOrphanageQueryDto } from './dto/nearby-orphanage-query.dto';
import { ResetOrphanagePasswordDto } from './dto/reset-orphanage-password.dto';
import { ToggleOrphanageStatusDto } from './dto/toggle-orphanage-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { OrphanageOwnershipGuard } from './guards/orphanage-ownership.guard';

@ApiTags('Orphanages')
@ApiBearerAuth()
@Controller('orphanages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrphanagesController {
  constructor(private readonly orphanagesService: OrphanagesService) { }

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new orphanage' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Orphanage registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Duplicate registration number or email' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePhoto', maxCount: 1 },
      { name: 'registrationCertificate', maxCount: 1 },
      { name: 'ngoCertificate', maxCount: 1 },
      { name: 'governmentLicense', maxCount: 1 },
      { name: 'administratorIdProof', maxCount: 1 },
      { name: 'panCard', maxCount: 1 },
      { name: 'addressProof', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createOrphanageDto: CreateOrphanageDto,
    @UploadedFiles() files: any,
    @Req() req: any,
  ) {
    return this.orphanagesService.create(
      createOrphanageDto,
      files,
      req.user.id,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.PARENT, Role.DONOR)
  @ApiOperation({ summary: 'Get all orphanages with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of orphanages retrieved successfully',
  })
  async findAll(@Query() query: OrphanageQueryDto) {
    return this.orphanagesService.findAll(query);
  }

  @Get('approved')
  @Roles(Role.PARENT, Role.DONOR)
  @ApiOperation({ summary: 'Get approved orphanages available for parent visit requests' })
  @ApiResponse({
    status: 200,
    description: 'Approved orphanages retrieved successfully',
  })
  async findApprovedForParents() {
    return this.orphanagesService.findApprovedForParents();
  }

  @Get('nearby')
  @Roles(Role.ADMIN, Role.PARENT, Role.DONOR)
  @ApiOperation({ summary: 'Get nearby orphanages by lat, lng, and radius' })
  @ApiResponse({
    status: 200,
    description: 'Nearby orphanages retrieved successfully',
  })
  async getNearby(@Query() query: NearbyOrphanageQueryDto) {
    return this.orphanagesService.getNearbyOrphanages(query);
  }

  @Get('dashboard/stats')
  @Roles(Role.ORPHANAGE)
  @UseGuards(OrphanageOwnershipGuard)
  @ApiOperation({ summary: 'Get orphanage dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(@Req() req: any) {
    return this.orphanagesService.getDashboardStats(req.user.id);
  }

  @Get('dashboard/safety-chart')
  @Roles(Role.ORPHANAGE)
  @UseGuards(OrphanageOwnershipGuard)
  @ApiOperation({ summary: 'Get monthly safety chart data' })
  @ApiResponse({
    status: 200,
    description: 'Safety chart data retrieved successfully',
  })
  async getSafetyChart(@Req() req: any) {
    return this.orphanagesService.getSafetyChart(req.user.id);
  }

  @Get('my-children')
  @Roles(Role.ORPHANAGE)
  @UseGuards(OrphanageOwnershipGuard)
  @ApiOperation({ summary: 'Get children in authenticated orphanage' })
  @ApiResponse({
    status: 200,
    description: 'Children list retrieved successfully',
  })
  async getMyChildren(@Req() req: any, @Query('limit') limit?: number) {
    return this.orphanagesService.getMyChildren(req.user.id, limit);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get single orphanage by ID' })
  @ApiResponse({
    status: 200,
    description: 'Orphanage retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  async findOne(@Param('id') id: string) {
    return this.orphanagesService.findOne(id);
  }

  @Get(':id/profile')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get complete orphanage profile with nested data' })
  @ApiResponse({
    status: 200,
    description: 'Orphanage profile retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  async getProfile(@Param('id') id: string) {
    return this.orphanagesService.getProfile(id);
  }

  @Get(':id/statistics')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get orphanage statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  async getStatistics(@Param('id') id: string) {
    return this.orphanagesService.getStatistics(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update orphanage details' })
  @ApiResponse({
    status: 200,
    description: 'Orphanage updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  async update(
    @Param('id') id: string,
    @Body() updateOrphanageDto: UpdateOrphanageDto,
    @Req() req: any,
  ) {
    return this.orphanagesService.update(id, updateOrphanageDto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete orphanage' })
  @ApiResponse({
    status: 200,
    description: 'Orphanage deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.orphanagesService.remove(id, req.user.id);
  }

  @Put(':id/licenses/:licenseId/verify')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Verify an orphanage license' })
  @ApiResponse({
    status: 200,
    description: 'License verified successfully and compliance recalculated',
  })
  @ApiResponse({ status: 404, description: 'License not found' })
  async verifyLicense(
    @Param('id') orphanageId: string,
    @Param('licenseId') licenseId: string,
    @Req() req: any,
  ) {
    return this.orphanagesService.verifyLicense(
      orphanageId,
      licenseId,
      req.user.id,
    );
  }

  @Put(':id/recalculate-compliance')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Manually recalculate orphanage compliance score' })
  @ApiResponse({
    status: 200,
    description: 'Compliance score recalculated successfully',
  })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  async recalculateCompliance(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.orphanagesService.recalculateCompliance(id, req.user.id);
  }

  @Patch(':id/reset-password')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reset password for orphanage user account' })
  @ApiResponse({
    status: 200,
    description: 'Orphanage password reset successfully',
  })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetOrphanagePasswordDto,
    @Req() req: any,
  ) {
    return this.orphanagesService.resetPassword(id, dto, req.user.id);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enable or disable orphanage account access' })
  @ApiResponse({
    status: 200,
    description: 'Orphanage account status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Orphanage not found' })
  async toggleStatus(
    @Param('id') id: string,
    @Body() dto: ToggleOrphanageStatusDto,
    @Req() req: any,
  ) {
    return this.orphanagesService.toggleStatus(id, dto, req.user.id);
  }
}
