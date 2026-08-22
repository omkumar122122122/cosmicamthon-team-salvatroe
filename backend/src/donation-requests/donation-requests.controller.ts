import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DonationRequestsService } from './donation-requests.service';
import { CreateDonationRequestDto } from './dto/create-donation-request.dto';
import { UpdateDonationRequestStatusDto } from './dto/update-donation-request-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Donation Requests')
@ApiBearerAuth('access-token')
@Controller('donation-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationRequestsController {
  constructor(
    private readonly donationRequestsService: DonationRequestsService,
  ) {}

  /**
   * POST /api/v1/donation-requests
   * Donor submits a new physical donation schedule request
   */
  @Post()
  @Roles(Role.DONOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new donation request (donor)' })
  @ApiResponse({ status: 201, description: 'Donation request submitted successfully' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDonationRequestDto,
  ) {
    return this.donationRequestsService.create(userId, dto);
  }

  /**
   * GET /api/v1/donation-requests/my
   * Donor views all their submitted donation requests
   */
  @Get('my')
  @Roles(Role.DONOR)
  @ApiOperation({ summary: 'Get all donation requests submitted by the authenticated donor' })
  @ApiResponse({ status: 200, description: 'List of donor donation requests' })
  async getMyRequests(@CurrentUser('userId') userId: string) {
    return this.donationRequestsService.findByDonor(userId);
  }

  /**
   * GET /api/v1/donation-requests/incoming
   * Orphanage views all incoming donation requests for their facility
   */
  @Get('incoming')
  @Roles(Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get all incoming donation requests (orphanage view)' })
  @ApiResponse({ status: 200, description: 'List of incoming donation requests for the orphanage' })
  async getIncoming(@CurrentUser('userId') userId: string) {
    return this.donationRequestsService.findByOrphanage(userId);
  }

  /**
   * GET /api/v1/donation-requests/:id
   * Get a single donation request by ID
   */
  @Get(':id')
  @Roles(Role.DONOR, Role.ORPHANAGE, Role.ADMIN)
  @ApiOperation({ summary: 'Get a single donation request by ID' })
  async findOne(@Param('id') id: string) {
    return this.donationRequestsService.findOne(id);
  }

  /**
   * PATCH /api/v1/donation-requests/:id/status
   * Orphanage accepts, rejects, or marks a donation request complete
   */
  @Patch(':id/status')
  @Roles(Role.ORPHANAGE)
  @ApiOperation({ summary: 'Update donation request status (orphanage action)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateDonationRequestStatusDto,
  ) {
    return this.donationRequestsService.updateStatus(id, userId, dto);
  }

  /**
   * PATCH /api/v1/donation-requests/:id/cancel
   * Donor cancels their own pending/accepted donation request
   */
  @Patch(':id/cancel')
  @Roles(Role.DONOR)
  @ApiOperation({ summary: 'Cancel a donation request (donor action)' })
  @ApiResponse({ status: 200, description: 'Donation request cancelled successfully' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.donationRequestsService.cancelByDonor(id, userId);
  }
}
