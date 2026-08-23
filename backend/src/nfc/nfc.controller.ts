import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { NfcService } from './nfc.service';
import {
  NfcVisitResponseDto,
  VerifyNfcDto,
  NfcVerificationResultDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('NFC Visit Pass')
@Controller('nfc')
export class NfcController {
  private readonly logger = new Logger(NfcController.name);

  constructor(private readonly nfcService: NfcService) {}

  /**
   * Public NFC Tag Tap Endpoint
   * Triggered when a phone scans an NFC card / digital tag.
   * Returns minimum sanitized visit, parent, and orphanage data.
   */
  @Get('visit/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public NFC Visit Pass lookup via secure token or NFC ID',
    description:
      'Resolves a token or NFC ID to active visit details. Exposes zero sensitive authentication or user credentials.',
  })
  @ApiResponse({
    status: 200,
    description: 'NFC visit pass details retrieved successfully',
    type: NfcVisitResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or inactive NFC token' })
  @ApiResponse({ status: 404, description: 'NFC pass or visit request not found' })
  async getVisitByToken(
    @Param('token') token: string,
  ): Promise<NfcVisitResponseDto> {
    return this.nfcService.getNfcVisitByToken(token);
  }

  /**
   * Dedicated Parent & Visit Details lookup by NFC ID (e.g. NFC-VST-8F3K92)
   */
  @Get('parent/:nfcId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lookup Parent & Visit Details by NFC ID (from physical NFC scanner)',
  })
  @ApiResponse({
    status: 200,
    description: 'Parent and visit details retrieved successfully',
    type: NfcVisitResponseDto,
  })
  async getParentByNfcId(
    @Param('nfcId') nfcId: string,
  ): Promise<NfcVisitResponseDto> {
    return this.nfcService.getNfcParentDetails(nfcId);
  }

  /**
   * Dedicated Scan lookup by NFC ID or token
   * GET /api/v1/nfc/scan/:nfcId
   */
  @Get('scan/:nfcId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lookup NFC Pass by scanned NFC ID or token',
  })
  @ApiResponse({
    status: 200,
    description: 'NFC pass details retrieved successfully',
    type: NfcVisitResponseDto,
  })
  async getScanByNfcId(
    @Param('nfcId') nfcId: string,
  ): Promise<NfcVisitResponseDto> {
    return this.nfcService.getNfcVisitByToken(nfcId);
  }

  /**
   * NFC Gate Verification Endpoint
   * Used by Orphanage Staff at gate scanner to verify a tap and check-in visitor.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify an NFC pass at gate and record entry',
    description:
      'Validates NFC token / ID, increments scan count, timestamps entry, and auto-records check-in on the visit request.',
  })
  @ApiBody({ type: VerifyNfcDto })
  @ApiResponse({
    status: 200,
    description: 'Verification outcome (SUCCESS, INVALID, EXPIRED, NOT_APPROVED)',
    type: NfcVerificationResultDto,
  })
  async verifyNfcTap(
    @Body() dto: VerifyNfcDto,
  ): Promise<NfcVerificationResultDto> {
    return this.nfcService.verifyNfcTap(dto);
  }

  /**
   * Authenticated endpoint to fetch NFC pass for a given Visit Request
   */
  @Get('request/:visitRequestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT, Role.ORPHANAGE, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get NFC pass details for a specific Visit Request' })
  @ApiResponse({
    status: 200,
    description: 'NFC pass retrieved successfully',
    type: NfcVisitResponseDto,
  })
  async getPassByVisitRequestId(
    @Param('visitRequestId') visitRequestId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<NfcVisitResponseDto> {
    return this.nfcService.getByVisitRequestId(visitRequestId, userId, userRole);
  }

  /**
   * Authenticated endpoint to explicitly generate / regenerate NFC pass for an approved visit
   */
  @Post('request/:visitRequestId/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT, Role.ORPHANAGE, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate or retrieve NFC pass for an approved visit' })
  @ApiResponse({
    status: 201,
    description: 'NFC pass created or retrieved',
    type: NfcVisitResponseDto,
  })
  async generatePass(
    @Param('visitRequestId') visitRequestId: string,
  ): Promise<NfcVisitResponseDto> {
    return this.nfcService.createOrGetNfcPass(visitRequestId);
  }
}
