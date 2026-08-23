import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { VisitRequestStatus, Role } from '@prisma/client';
import * as crypto from 'crypto';
import {
  NfcVisitResponseDto,
  VerifyNfcDto,
  NfcVerificationResultDto,
} from './dto';

@Injectable()
export class NfcService {
  private readonly logger = new Logger(NfcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a unique human-readable NFC Pass ID (e.g., NFC-VST-8F3K92)
   */
  async generateNfcId(): Promise<string> {
    let nfcId = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      nfcId = `NFC-VST-${randomHex}`;

      const existing = await this.prisma.nfcVisit.findUnique({
        where: { nfcId },
        select: { id: true },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      nfcId = `NFC-VST-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    }

    return nfcId;
  }

  /**
   * Generates a cryptographically secure token (64 hex characters)
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Constructs the full NFC scan URL using configured public URL / frontend URL
   */
  private buildNfcUrl(tokenOrNfcId: string): string {
    const publicUrl =
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('VITE_PUBLIC_APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('app.frontendUrl') ||
      'http://localhost:5173';

    const baseUrl = publicUrl.replace(/\/+$/, '');
    return `${baseUrl}/nfc/scan/${encodeURIComponent(tokenOrNfcId)}`;
  }

  /**
   * Creates or retrieves an existing NFC Visit record for an approved Visit Request
   */
  async createOrGetNfcPass(visitRequestId: string): Promise<NfcVisitResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id: visitRequestId },
      include: {
        parent: {
          include: {
            user: true,
            addresses: { where: { isPrimary: true }, take: 1 },
          },
        },
        orphanage: true,
        child: true,
        nfcVisit: true,
      },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${visitRequestId} not found`);
    }

    if (
      visitRequest.status !== VisitRequestStatus.APPROVED &&
      visitRequest.status !== VisitRequestStatus.RESCHEDULED &&
      visitRequest.status !== VisitRequestStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `NFC visit pass can only be generated for APPROVED visit requests (current status: ${visitRequest.status})`,
      );
    }

    // Return existing active pass if present
    if (visitRequest.nfcVisit) {
      return this.mapToResponseDto(visitRequest.nfcVisit, visitRequest);
    }

    // Generate new unique credentials
    const nfcId = await this.generateNfcId();
    const secureToken = this.generateSecureToken();

    const nfcVisit = await this.prisma.nfcVisit.create({
      data: {
        nfcId,
        secureToken,
        visitRequestId: visitRequest.id,
        isActive: true,
      },
    });

    this.logger.log(
      `NFC Visit pass created: ${nfcId} for visit request ${visitRequest.requestId}`,
    );

    return this.mapToResponseDto(nfcVisit, visitRequest);
  }

  /**
   * Public lookup endpoint for NFC tag / card: GET /api/v1/nfc/visit/:tokenOrId
   * Handles either 64-char crypto token OR human NFC ID (e.g. NFC-VST-8F3K92).
   */
  async getNfcVisitByToken(tokenOrId: string): Promise<NfcVisitResponseDto> {
    if (!tokenOrId || typeof tokenOrId !== 'string') {
      throw new BadRequestException('Valid NFC token or NFC ID is required');
    }

    const clean = tokenOrId.trim();
    const isNfcId = clean.toUpperCase().startsWith('NFC-VST-');

    const where = isNfcId
      ? { nfcId: clean.toUpperCase() }
      : { secureToken: clean };

    const nfcVisit = await this.prisma.nfcVisit.findUnique({
      where: where as any,
      include: {
        visitRequest: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
                addresses: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
            orphanage: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
                phone: true,
                addressLine1: true,
                addressLine2: true,
              },
            },
            child: {
              select: {
                id: true,
                childCode: true,
                firstName: true,
                lastName: true,
                approximateAge: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    if (!nfcVisit) {
      throw new NotFoundException(`NFC Pass [${clean}] not found or invalid`);
    }

    if (!nfcVisit.isActive) {
      throw new BadRequestException('This NFC visit pass is deactivated or revoked');
    }

    const vr = nfcVisit.visitRequest;
    if (!vr) {
      throw new NotFoundException('Associated visit request not found');
    }

    return this.mapToResponseDto(nfcVisit, vr);
  }

  /**
   * Specific Parent & Visit Details lookup by NFC ID: GET /api/v1/nfc/parent/:nfcId
   */
  async getNfcParentDetails(nfcId: string): Promise<NfcVisitResponseDto> {
    return this.getNfcVisitByToken(nfcId);
  }

  /**
   * Retrieves an NFC pass by visit request ID with role-based access validation
   */
  async getByVisitRequestId(
    visitRequestId: string,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<NfcVisitResponseDto> {
    const visitRequest = await this.prisma.visitRequest.findUnique({
      where: { id: visitRequestId },
      include: {
        parent: {
          include: {
            user: true,
            addresses: { where: { isPrimary: true }, take: 1 },
          },
        },
        orphanage: true,
        child: true,
        nfcVisit: true,
      },
    });

    if (!visitRequest) {
      throw new NotFoundException(`Visit request with ID ${visitRequestId} not found`);
    }

    // Validate access
    if (requestUserRole === Role.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: requestUserId },
      });
      if (!parent || visitRequest.parentId !== parent.id) {
        throw new ForbiddenException('You can only access NFC passes for your own visit requests');
      }
    } else if (requestUserRole === Role.ORPHANAGE) {
      const orphanage = await this.prisma.orphanage.findFirst({
        where: { userId: requestUserId },
      });
      const staff = await this.prisma.orphanageStaff.findFirst({
        where: { userId: requestUserId, isActive: true },
      });
      const userOrphanageId = orphanage?.id || staff?.orphanageId;

      if (visitRequest.orphanageId !== userOrphanageId) {
        throw new ForbiddenException('You can only access NFC passes for your orphanage');
      }
    }

    // If pass already exists, return it
    if (visitRequest.nfcVisit) {
      return this.mapToResponseDto(visitRequest.nfcVisit, visitRequest);
    }

    // Auto-create pass for approved requests
    if (
      visitRequest.status === VisitRequestStatus.APPROVED ||
      visitRequest.status === VisitRequestStatus.RESCHEDULED ||
      visitRequest.status === VisitRequestStatus.COMPLETED
    ) {
      return this.createOrGetNfcPass(visitRequestId);
    }

    // Return pending placeholder state
    return {
      nfcId: '',
      secureToken: '',
      nfcUrl: '',
      visitRequestId: visitRequest.id,
      requestId: visitRequest.requestId,
      visitStatus: visitRequest.status,
      visitDate: visitRequest.visitDate,
      visitTime: visitRequest.visitTime,
      meetingRoom: visitRequest.meetingRoom || undefined,
      assignedStaff: visitRequest.assignedStaff || undefined,
      parent: {
        id: visitRequest.parent?.id || '',
        name: `${visitRequest.parent?.user?.firstName || ''} ${visitRequest.parent?.user?.lastName || ''}`.trim() || 'Parent',
        address: visitRequest.parent?.addresses?.[0]?.addressLine1 || undefined,
      },
      orphanage: {
        id: visitRequest.orphanage?.id || '',
        name: visitRequest.orphanage?.name || 'Orphanage',
        city: visitRequest.orphanage?.city || undefined,
      },
      isValid: false,
      scanCount: 0,
      createdAt: visitRequest.createdAt,
    };
  }

  /**
   * Verifies an NFC pass tap at the orphanage gate, increments scan count, and records check-in.
   */
  async verifyNfcTap(
    dto: VerifyNfcDto,
    verifierUserId?: string,
  ): Promise<NfcVerificationResultDto> {
    const { token, nfcId } = dto;

    if (!token && !nfcId) {
      throw new BadRequestException('Either secureToken or nfcId must be provided for verification');
    }

    const where = token ? { secureToken: token } : { nfcId };
    const nfcVisit = await this.prisma.nfcVisit.findUnique({
      where: where as any,
      include: {
        visitRequest: {
          include: {
            parent: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true, phone: true },
                },
                addresses: { where: { isPrimary: true }, take: 1 },
              },
            },
            orphanage: { select: { id: true, name: true, city: true } },
            child: { select: { id: true, childCode: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!nfcVisit) {
      return {
        status: 'INVALID',
        message: 'NFC Pass not recognized or invalid signature.',
        verifiedAt: new Date(),
      };
    }

    if (!nfcVisit.isActive) {
      return {
        status: 'EXPIRED',
        message: 'This NFC pass has been revoked or deactivated.',
        verifiedAt: new Date(),
      };
    }

    const vr = nfcVisit.visitRequest;
    if (!vr || (vr.status !== VisitRequestStatus.APPROVED && vr.status !== VisitRequestStatus.RESCHEDULED && vr.status !== VisitRequestStatus.COMPLETED)) {
      return {
        status: 'NOT_APPROVED',
        message: `Visit Request is not currently active (Status: ${vr?.status || 'UNKNOWN'}).`,
        verifiedAt: new Date(),
      };
    }

    // Increment scan count, record scan timestamp and audit log
    const updatedNfc = await this.prisma.nfcVisit.update({
      where: { id: nfcVisit.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
        lastScannedBy: verifierUserId || 'GATE_SCANNER',
      },
    });

    // Create immutable audit entry in nfc_scans
    try {
      await (this.prisma as any).nfcScan?.create({
        data: {
          nfcVisitId: nfcVisit.id,
          scannedBy: verifierUserId || 'GATE_SCANNER',
          result: 'SUCCESS',
          notes: dto.notes || dto.gateLocation || undefined,
        },
      });
    } catch (scanLogErr) {
      this.logger.warn('Non-blocking scan log write warning:', scanLogErr);
    }

    // Fetch latest scan history
    let recentScans = [];
    try {
      recentScans = await (this.prisma as any).nfcScan?.findMany({
        where: { nfcVisitId: nfcVisit.id },
        orderBy: { scannedAt: 'desc' },
        take: 10,
      }) || [];
    } catch {
      recentScans = [];
    }

    (updatedNfc as any).scans = recentScans;

    // Auto-record check-in on visit request if not already checked in
    if (!vr.checkInTime) {
      await this.prisma.visitRequest.update({
        where: { id: vr.id },
        data: {
          checkInTime: new Date(),
          qrStatus: 'Checked In (NFC)',
        },
      });
      vr.checkInTime = new Date();
    }

    this.logger.log(
      `NFC Tap Verified: ${nfcVisit.nfcId} (Scan #${updatedNfc.scanCount}) by ${verifierUserId || 'GATE'}`,
    );

    const passDetails = this.mapToResponseDto(updatedNfc, vr);

    return {
      status: 'SUCCESS',
      message: `Verified successfully! Welcome ${passDetails.parent.name} to ${passDetails.orphanage.name}.`,
      verifiedAt: new Date(),
      passDetails,
    };
  }

  /**
   * Sanitizes and maps database entities into safe public-facing DTO
   */
  private mapToResponseDto(nfcVisit: any, visitRequest: any): NfcVisitResponseDto {
    const parent = visitRequest.parent;
    const user = parent?.user;
    const orphanage = visitRequest.orphanage;
    const child = visitRequest.child;
    const primaryAddress = parent?.addresses?.[0];

    const parentName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : 'Parent';

    const parentAddress = primaryAddress
      ? `${primaryAddress.addressLine1 || ''}, ${primaryAddress.city || ''}, ${primaryAddress.state || ''}`.trim()
      : undefined;

    const nfcUrl = this.buildNfcUrl(nfcVisit.secureToken);
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(nfcUrl)}`;

    return {
      nfcId: nfcVisit.nfcId,
      secureToken: nfcVisit.secureToken,
      nfcUrl,
      qrCode,
      visitRequestId: visitRequest.id,
      requestId: visitRequest.requestId,
      visitStatus: visitRequest.status,
      visitDate: visitRequest.visitDate,
      visitTime: visitRequest.visitTime,
      meetingRoom: visitRequest.meetingRoom || undefined,
      assignedStaff: visitRequest.assignedStaff || undefined,
      parent: {
        id: parent?.id || '',
        name: parentName,
        address: parentAddress,
        phone: user?.phone || undefined,
        email: user?.email || undefined,
      },
      orphanage: {
        id: orphanage?.id || '',
        name: orphanage?.name || 'Orphanage',
        city: orphanage?.city || undefined,
        state: orphanage?.state || undefined,
        phone: orphanage?.phone || undefined,
        address: orphanage?.addressLine1 || undefined,
      },
      child: child
        ? {
            id: child.id,
            name: `${child.firstName || ''} ${child.lastName || ''}`.trim(),
            code: child.childCode,
            age: child.approximateAge || undefined,
            gender: child.gender || undefined,
          }
        : undefined,
      isValid: nfcVisit.isActive && (visitRequest.status === VisitRequestStatus.APPROVED || visitRequest.status === VisitRequestStatus.RESCHEDULED),
      scanCount: nfcVisit.scanCount || 0,
      lastScannedAt: nfcVisit.lastScannedAt || undefined,
      scans: Array.isArray(nfcVisit.scans)
        ? nfcVisit.scans.map((s: any) => ({
            id: s.id,
            scannedAt: s.scannedAt,
            scannedBy: s.scannedBy || undefined,
            result: s.result,
            notes: s.notes || undefined,
          }))
        : undefined,
      createdAt: nfcVisit.createdAt,
    };
  }
}
