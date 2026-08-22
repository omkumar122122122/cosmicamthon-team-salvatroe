import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ParentsService } from './services/parents.service';
import {
  CreateParentDto,
  UpdateParentDto,
  QueryParentDto,
  UpdateVerificationStatusDto,
  CreateAddressDto,
  CreateFamilyMemberDto,
  ReviewDocumentDto,
  ManualTrustScoreDto,
  SubmitKycDto,
  RegisterParentDto,
  RequestDocumentUpdateDto,
  RequestReuploadDto,
} from './dto';
import {
  PaginatedParentsResponseDto,
  ParentProfileDto,
  ParentDashboardDto,
  KYCStatusDto,
  VerificationQueueResponseDto,
} from './dto/parent-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from './constants/parent.constants';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@ApiTags('Parents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
  private readonly logger = new Logger(ParentsController.name);

  constructor(
  private readonly parentsService: ParentsService,
  private readonly prisma: PrismaService,
  private readonly configService: ConfigService,
  private readonly notificationsService: NotificationsService,
) {}

@Public()
@Post('register')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({
  summary: 'Register a new parent (public endpoint)',
  description:
    'Creates a new user account with PARENT role and parent profile. The user will be in PENDING verification status until an admin approves them.',
})
@ApiBody({ type: RegisterParentDto })
@ApiResponse({
  status: 201,
  description: 'Parent registration successful — pending admin verification',
})
@ApiResponse({ status: 409, description: 'Email already registered' })
@ApiResponse({ status: 400, description: 'Validation error' })
async registerParent(@Body() dto: RegisterParentDto) {
  // Check email uniqueness (case-insensitive to catch any existing mixed-case entries)
  const existing = await this.prisma.user.findFirst({
    where: { email: { equals: dto.email, mode: 'insensitive' } },
  });
  if (existing) {
    throw new BadRequestException('An account with this email already exists');
  }

  // Check phone uniqueness if provided
  if (dto.phone) {
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new BadRequestException('An account with this phone number already exists');
    }
  }

  const bcryptRounds = this.configService.get<number>('app.security.bcryptRounds', 12);

  // Hash password
  const hashedPassword = await bcrypt.hash(dto.password, bcryptRounds);

  // Create user with PARENT role
  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName || '',
      phone: dto.phone,
      password: hashedPassword,
      role: Role.PARENT,
      isEmailVerified: false,
      passwordChangedAt: new Date(),
    },
  });

  // Create parent profile
  const parent = await this.parentsService.create(user.id, {
    dateOfBirth: dto.dateOfBirth || undefined,
    nationality: dto.nationality || 'Indian',
    occupation: dto.occupation || undefined,
    annualIncome: dto.annualIncome || undefined,
    houseOwnership: dto.houseOwnership || undefined,
    numberOfRooms: dto.numberOfRooms || undefined,
    adoptionMotivation: dto.adoptionMotivation || undefined,
  } as any);

  // Send notification to all admins
  try {
    const adminUsers = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    const adminIds = adminUsers.map((a) => a.id);
    if (adminIds.length > 0) {
      await this.notificationsService.sendBulkNotifications(
        adminIds,
        NotificationType.KYC_STATUS_CHANGED,
        'New Parent Registration',
        `${dto.firstName} ${dto.lastName || ''} has registered and is pending verification.`,
        {
          relatedEntityType: 'PARENT',
          relatedEntityId: parent.id,
        },
      );
    }
    this.logger.log(`Notification sent to ${adminIds.length} admins for new parent registration`);
  } catch (error) {
    this.logger.error('Failed to send admin notification:', error);
  }

  this.logger.log(`Parent registered: ${user.email} (${user.id})`);

  return {
    message:
      'Parent registration submitted successfully. An admin will verify your account.',
    userId: user.id,
    parentId: parent.id,
  };
}

  @Post()
  @Roles(Role.PARENT, Role.ADMIN)
  @ApiOperation({ summary: 'Create parent profile' })
  @ApiResponse({ status: 201, description: 'Parent profile created successfully' })
  @ApiResponse({ status: 400, description: 'Parent profile already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateParentDto })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createParentDto: CreateParentDto,
  ) {
    return this.parentsService.create(userId, createParentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORPHANAGE)
  @ApiOperation({ summary: 'Get all parents with filters and pagination' })
  @ApiResponse({ status: 200, type: PaginatedParentsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Query() queryDto: QueryParentDto,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('sub') userId: string,
  ) {
    return this.parentsService.findAll(queryDto, userRole, userId);
  }

  @Get('dashboard')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Get parent dashboard data' })
  @ApiResponse({ status: 200, type: ParentDashboardDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Parent profile not found' })
  getDashboard(@CurrentUser('sub') userId: string) {
    return this.parentsService.getDashboard(userId);
  }

  @Get('kyc')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Get KYC status and compliance' })
  @ApiResponse({ status: 200, type: KYCStatusDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Parent profile not found' })
  getKycStatus(@CurrentUser('sub') userId: string) {
    return this.parentsService.getKycStatus(userId);
  }

  @Post('kyc/submit')
  @Roles(Role.PARENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit KYC package for admin review' })
  @ApiResponse({ status: 200, description: 'KYC submitted successfully' })
  @ApiResponse({ status: 400, description: 'Missing required documents or already approved' })
  @ApiBody({ type: SubmitKycDto })
  submitKyc(
    @CurrentUser('sub') userId: string,
    @Body() dto: SubmitKycDto,
  ) {
    return this.parentsService.submitKyc(userId, dto);
  }

  @Post('kyc/request-update')
  @Roles(Role.PARENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request document update for an approved KYC profile' })
  @ApiResponse({ status: 200, description: 'Document update request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Only allowed for approved KYC profiles' })
  @ApiBody({ type: RequestDocumentUpdateDto })
  requestDocumentUpdate(
    @CurrentUser('sub') userId: string,
    @Body() dto: RequestDocumentUpdateDto,
  ) {
    return this.parentsService.requestDocumentUpdate(userId, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORPHANAGE, Role.PARENT)
  @ApiOperation({ summary: 'Get parent profile by ID' })
  @ApiResponse({ status: 200, type: ParentProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.parentsService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PARENT)
  @ApiOperation({ summary: 'Update parent profile' })
  @ApiResponse({ status: 200, description: 'Parent profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateParentDto: UpdateParentDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    await this.parentsService.update(id, updateParentDto, userId, userRole);
    return { message: 'Parent profile updated successfully' };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete parent profile' })
  @ApiResponse({ status: 200, description: 'Parent profile deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.parentsService.remove(id);
    return { message: 'Parent profile deleted successfully' };
  }

  @Post(':id/documents')
  @Roles(Role.ADMIN, Role.PARENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Invalid file type. Allowed: ${ALLOWED_DOCUMENT_MIME_TYPES.join(', ')}`,
            ) as any,
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a parent identity / supporting document' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['documentType', 'file'],
      properties: {
        documentType: { type: 'string', example: 'AADHAAR_CARD' },
        documentNumber: { type: 'string', example: 'XXXX-XXXX-1234' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  uploadDocument(
    @Param('id') id: string,
    @Body('documentType') documentType: string,
    @Body('documentNumber') documentNumber: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!documentType) {
      throw new BadRequestException('documentType is required');
    }
    return this.parentsService.uploadDocument(
      id,
      documentType,
      file,
      userId,
      userRole,
      documentNumber,
    );
  }

  @Post(':id/documents/batch')
  @Roles(Role.ADMIN, Role.PARENT)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Invalid file type. Allowed: ${ALLOWED_DOCUMENT_MIME_TYPES.join(', ')}`,
            ) as any,
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple parent identity / supporting documents in batch' })
  uploadBatchDocuments(
    @Param('id') id: string,
    @Body('documentTypes') documentTypes: string | string[],
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    const typesArray = Array.isArray(documentTypes)
      ? documentTypes
      : typeof documentTypes === 'string'
        ? documentTypes.split(',')
        : [];
    return this.parentsService.uploadBatchDocuments(
      id,
      files,
      typesArray,
      userId,
      userRole,
    );
  }

  @Patch(':id/documents/:docId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) a parent document' })
  @ApiBody({ type: ReviewDocumentDto })
  reviewDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: ReviewDocumentDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.parentsService.reviewDocument(id, docId, dto, adminId);
  }

  @Post(':id/addresses')
  @Roles(Role.ADMIN, Role.PARENT)
  @ApiOperation({ summary: 'Add an address to a parent profile' })
  @ApiBody({ type: CreateAddressDto })
  addAddress(
    @Param('id') id: string,
    @Body() dto: CreateAddressDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.parentsService.addAddress(id, dto, userId, userRole);
  }

  @Post(':id/family-members')
  @Roles(Role.ADMIN, Role.PARENT)
  @ApiOperation({ summary: 'Add a family member to a parent profile' })
  @ApiBody({ type: CreateFamilyMemberDto })
  addFamilyMember(
    @Param('id') id: string,
    @Body() dto: CreateFamilyMemberDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.parentsService.addFamilyMember(id, dto, userId, userRole);
  }

  @Post(':id/trust-score')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually adjust parent trust score' })
  @ApiBody({ type: ManualTrustScoreDto })
  updateTrustScore(
    @Param('id') id: string,
    @Body() dto: ManualTrustScoreDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.parentsService.updateTrustScore(id, dto, adminId);
  }

  @Patch(':id/verification-status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update parent verification status' })
  @ApiResponse({ status: 200, description: 'Verification status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @HttpCode(HttpStatus.OK)
  async updateVerificationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVerificationStatusDto,
    @CurrentUser('sub') adminId: string,
  ) {
    await this.parentsService.updateVerificationStatus(id, dto, adminId);
    return { message: 'Verification status updated successfully' };
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve parent application' })
  @ApiResponse({ status: 200, description: 'Parent approved successfully' })
  @ApiResponse({ status: 400, description: 'Parent already approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
  ) {
    await this.parentsService.approveParent(id, adminId);
    return { message: 'Parent approved successfully' };
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject parent application' })
  @ApiResponse({ status: 200, description: 'Parent rejected successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'Incomplete documents' },
      },
      required: ['reason'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    if (!reason?.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }
    await this.parentsService.rejectParent(id, reason, adminId);
    return { message: 'Parent rejected successfully' };
  }

  @Post(':id/request-reupload')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Request document re-upload from parent' })
  @ApiResponse({ status: 200, description: 'Document re-upload requested successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @ApiBody({ type: RequestReuploadDto })
  @HttpCode(HttpStatus.OK)
  async requestReupload(
    @Param('id') id: string,
    @Body() dto: RequestReuploadDto,
    @CurrentUser('sub') adminId: string,
  ) {
    await this.parentsService.requestReupload(id, dto, adminId);
    return { message: 'Document re-upload requested successfully' };
  }
}

@ApiTags('Admin - Parent Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/parents')
export class AdminParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('verification/queue')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get parent verification queue' })
  @ApiResponse({ status: 200, type: VerificationQueueResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getVerificationQueue(@Query() queryDto: QueryParentDto) {
    return this.parentsService.getVerificationQueue(queryDto);
  }

  @Get(':id/verification-details')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get full parent verification details' })
  @ApiResponse({ status: 200, type: ParentProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  getVerificationDetails(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.parentsService.findOne(id, userId, userRole);
  }
}