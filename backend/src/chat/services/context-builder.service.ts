import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RetrievedContext } from '../interfaces/context.interface';

/**
 * ContextBuilderService
 * ────────────────────────────────────────────────────────────────────────────
 * Fetches all relevant data from the database before calling the AI.
 * Acts as the RAG retrieval layer — separates data fetching from AI generation.
 */
@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve all context for a parent chat session.
   * Runs all database queries in parallel for performance.
   *
   * @param parentId Parent's database ID (NOT userId)
   * @param childId Optional child ID (verified for ownership first)
   * @returns Aggregated context object
   */
  async retrieveContext(parentId: string, childId?: string): Promise<RetrievedContext> {
    const context: RetrievedContext = {};

    try {
      // Fetch parent data (profile + KYC + visits + adoption)
      const [parentData, kycData, visitsData, adoptionData] = await Promise.all([
        this.getParentProfile(parentId),
        this.getKycStatus(parentId),
        this.getVisitRequests(parentId),
        this.getAdoptionStatus(parentId),
      ]);

      context.parentProfile = parentData;
      context.kycStatus = kycData;
      context.visitRequests = visitsData;
      context.adoptionStatus = adoptionData;

      // If childId provided, fetch child data (after verifying ownership)
      if (childId) {
        const isOwner = await this.verifyChildOwnership(parentId, childId);
        if (isOwner) {
          const [childData, healthData, vaccinationData, appointmentData] = await Promise.all([
            this.getChildProfile(childId),
            this.getHealthReports(childId),
            this.getVaccinations(childId),
            this.getAppointments(childId),
          ]);

          context.childProfile = childData;
          context.healthReports = healthData;
          context.vaccinations = vaccinationData;
          context.appointments = appointmentData;
        } else {
          this.logger.warn(`Parent ${parentId} attempted to access child ${childId} without ownership`);
        }
      }

      this.logger.debug(`Context retrieved for parent ${parentId}: ${Object.keys(context).length} sections`);
    } catch (error) {
      this.logger.error(`Context retrieval error for parent ${parentId}:`, error);
    }

    return context;
  }

  private async getParentProfile(parentId: string): Promise<Record<string, any> | undefined> {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        user: {
          select: {
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
    });

    if (!parent) return undefined;

    return {
      'Parent Name': `${parent.user.firstName} ${parent.user.lastName}`,
      'Email': parent.user.email,
      'Phone': parent.user.phone || 'Not provided',
      'Trust Score': `${parent.trustScore} / 100`,
      'Verification Status': parent.verificationStatus,
      'Marital Status': parent.maritalStatus || 'Not provided',
      'Occupation': parent.occupation || 'Not provided',
      'Annual Income': parent.annualIncome ? `₹${parent.annualIncome.toLocaleString('en-IN')}` : 'Not disclosed',
      'House Ownership': parent.houseOwnership || 'Not provided',
      'Emergency Contact': parent.emergencyContact || 'Not provided',
      'Registered On': parent.createdAt.toLocaleDateString('en-IN'),
    };
  }

  private async getKycStatus(parentId: string): Promise<Record<string, any> | undefined> {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
      select: {
        kycStatus: true,
        kycSubmittedAt: true,
        kycApprovedAt: true,
      },
    });

    if (!parent) return undefined;

    return {
      'KYC Status': parent.kycStatus,
      'KYC Approved Date': parent.kycApprovedAt?.toLocaleDateString('en-IN') || 'Pending',
      'Verification Type': 'One-Time Pre-Adoption Verification',
    };
  }

  private async getChildProfile(childId: string): Promise<Record<string, any> | undefined> {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        orphanage: {
          select: {
            name: true,
            city: true,
            state: true,
            phone: true,
          },
        },
        assignedSocialWorker: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!child) return undefined;

    const age = child.dateOfBirth
      ? Math.floor((Date.now() - child.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : child.approximateAge || 0;

    return {
      'Child Name': `${child.firstName} ${child.lastName || ''}`.trim(),
      'Child Code': child.childCode,
      'Age': `${age} years`,
      'Gender': child.gender,
      'Blood Group': child.bloodGroup,
      'Health Status': child.healthStatus,
      'Orphanage': child.orphanage?.name || 'Not assigned',
      'Orphanage Location': child.orphanage ? `${child.orphanage.city}, ${child.orphanage.state}` : 'N/A',
      'Orphanage Phone': child.orphanage?.phone || 'Not available',
      'Assigned Social Worker': child.assignedSocialWorker
        ? `${child.assignedSocialWorker.firstName} ${child.assignedSocialWorker.lastName}`
        : 'Not assigned',
      'Admission Date': child.admissionDate.toLocaleDateString('en-IN'),
      'Current Status': child.currentStatus,
      'Adoption Status': child.adoptionStatus,
    };
  }

  private async getHealthReports(childId: string): Promise<Array<Record<string, any>>> {
    const reports = await this.prisma.healthReport.findMany({
      where: { childId },
      orderBy: { reportDate: 'desc' },
      take: 3,
    });

    return reports.map((r) => ({
      'Report Date': r.reportDate.toLocaleDateString('en-IN'),
      'Health Status': r.healthStatus,
      'Height (cm)': r.height || 'Not recorded',
      'Weight (kg)': r.weight || 'Not recorded',
      'BMI': r.bmi || 'Not calculated',
      'Findings': r.findings || 'None',
      'Diagnosis': r.diagnosis || 'None',
      'Follow-up Date': r.followUpDate?.toLocaleDateString('en-IN') || 'Not scheduled',
    }));
  }

  private async getVaccinations(childId: string): Promise<Array<Record<string, any>>> {
    // Placeholder — replace with real vaccination table query once available
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { isVaccinationComplete: true },
    });

    if (!child) return [];

    // Demo data until vaccination table is added
    return [
      {
        vaccine: 'BCG',
        dateGiven: '2014-04-12',
        nextDue: null,
        status: 'Completed',
      },
      {
        vaccine: 'MMR',
        dateGiven: '2017-10-05',
        nextDue: null,
        status: 'Completed',
      },
      {
        vaccine: 'Typhoid Booster',
        dateGiven: null,
        nextDue: '2025-09-14',
        status: child.isVaccinationComplete ? 'Completed' : 'Overdue',
      },
    ];
  }

  private async getAppointments(childId: string): Promise<Array<Record<string, any>>> {
    // Fetch upcoming welfare sessions for this child
    const sessions = await this.prisma.welfareSession.findMany({
      where: {
        childId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    return sessions.map((s) => ({
      type: 'Welfare Session',
      date: s.scheduledAt.toLocaleDateString('en-IN'),
      time: s.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: s.status,
      notes: s.sessionNotes || '',
    }));
  }

  private async getVisitRequests(parentId: string): Promise<Array<Record<string, any>>> {
    try {
      const visits = await this.prisma.visitRequest.findMany({
        where: { parentId },
        orderBy: { visitDate: 'desc' },
        take: 5,
        select: {
          id: true,
          purpose: true,
          visitDate: true,
          visitTime: true,
          status: true,
          riskLevel: true,
          orphanage: {
            select: {
              name: true,
            },
          },
        },
      });

      return visits.map((v) => ({
        requestId: v.id,
        purpose: v.purpose,
        visitDate: v.visitDate.toLocaleDateString('en-IN'),
        visitTime: v.visitTime,
        orphanage: v.orphanage.name,
        status: v.status,
        riskLevel: v.riskLevel,
      }));
    } catch (error: any) {
      this.logger.warn(`Failed to fetch visit requests for parent ${parentId}: ${error.message}`);
      return [];
    }
  }

  private async getAdoptionStatus(parentId: string): Promise<Record<string, any> | undefined> {
    const adoption = await this.prisma.adoptionRecord.findFirst({
      where: {
        adoptiveParentId: parentId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        child: {
          select: {
            childCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!adoption) return undefined;

    return {
      'Child': `${adoption.child.firstName} ${adoption.child.lastName || ''} (${adoption.child.childCode})`,
      'Adoption Status': adoption.status,
      'Matched Date': adoption.matchedDate?.toLocaleDateString('en-IN') || 'Not matched',
      'Legal Process Started': adoption.legalProcessStart?.toLocaleDateString('en-IN') || 'Not started',
      'Completed Date': adoption.completedDate?.toLocaleDateString('en-IN') || 'Not completed',
      'Court Case Number': adoption.courtCaseNumber || 'Not assigned',
    };
  }

  /**
   * Verify that a parent owns (is linked to) a specific child.
   * Checks via AdoptionRecord table.
   */
  private async verifyChildOwnership(parentId: string, childId: string): Promise<boolean> {
    const adoption = await this.prisma.adoptionRecord.findFirst({
      where: {
        childId,
        adoptiveParentId: parentId,
      },
    });

    return !!adoption;
  }
}
