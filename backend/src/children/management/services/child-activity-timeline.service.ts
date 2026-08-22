import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ITimelineEvent } from '../interfaces/child-management.interface';

@Injectable()
export class ChildActivityTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds a complete, unified chronological activity timeline for a child.
   */
  async getChildTimeline(childId: string): Promise<ITimelineEvent[]> {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        orphanage: { select: { name: true } },
        biometricData: true,
        medicalHistories: true,
        documents: true,
        attendanceRecords: { take: 30, orderBy: { date: 'desc' } },
        healthReports: { take: 20, orderBy: { reportDate: 'desc' } },
      },
    });

    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found.`);
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { resourceId: childId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const events: ITimelineEvent[] = [];
    const orphanageName = child.orphanage?.name || 'Care Center';

    // 1. Initial Intake / Admission Event
    events.push({
      id: `admission-${child.id}`,
      eventType: 'REGISTRATION',
      title: 'Child Admission & Intake Registration',
      description: `Registered at ${orphanageName} with Child Code ${child.childCode}. Entry source: ${child.entrySource || 'Intake'}.`,
      timestamp: child.admissionDate || child.createdAt,
      metadata: { childCode: child.childCode, orphanage: orphanageName },
    });

    // 2. AI Biometric Enrollment Event
    child.biometricData.forEach((bio) => {
      events.push({
        id: `biometric-${bio.id}`,
        eventType: 'BIOMETRIC_ENROLLMENT',
        title: 'AI Face Biometric Enrollment Completed',
        description: `Enrolled face biometric vector with quality score ${bio.quality}%. Model: ${bio.faceModelVersion || 'FaceNet-v512-Crypto'}.`,
        timestamp: bio.capturedAt,
        metadata: { quality: bio.quality, type: bio.type },
      });
    });

    // 3. Medical Intake Records
    child.medicalHistories.forEach((med) => {
      events.push({
        id: `medical-${med.id}`,
        eventType: 'MEDICAL_RECORD',
        title: `Medical Evaluation: ${med.conditionName || 'Routine Checkup'}`,
        description: med.treatmentDetails || 'Initial medical examination completed.',
        timestamp: med.createdAt,
        metadata: { allergies: med.allergies, medications: med.medications },
      });
    });

    // 4. Attendance Check-ins
    child.attendanceRecords.forEach((att) => {
      events.push({
        id: `attendance-${att.id}`,
        eventType: 'ATTENDANCE',
        title: `Attendance Marked: ${att.status}`,
        description: `Check-in recorded via AI Face Match (Confidence: ${att.faceMatchScore || 90}%). Activity: ${att.activity || 'Regular Session'}.`,
        timestamp: att.checkInTime || att.date,
        metadata: { status: att.status, matchScore: att.faceMatchScore },
      });
    });

    // 5. Wellness & Emotion Monitoring Reports
    child.healthReports.forEach((report) => {
      events.push({
        id: `wellness-${report.id}`,
        eventType: 'WELLNESS_EVALUATION',
        title: `Wellness Check: ${report.diagnosis || 'Normal'}`,
        description: `Health findings: ${report.findings || 'Healthy evaluation'}. Status: ${report.healthStatus}.`,
        timestamp: report.reportDate,
        metadata: { diagnosis: report.diagnosis, status: report.healthStatus },
      });
    });

    // 6. Uploaded Documents
    child.documents.forEach((doc) => {
      events.push({
        id: `doc-${doc.id}`,
        eventType: 'DOCUMENT_UPLOAD',
        title: `Document Uploaded: ${doc.title}`,
        description: `Type: ${doc.documentType}. Uploaded file: ${doc.fileName}. Verified: ${doc.isVerified ? 'Yes' : 'No'}.`,
        timestamp: doc.createdAt,
        metadata: { documentType: doc.documentType, isVerified: doc.isVerified },
      });
    });

    // 7. Audit Log Events
    auditLogs.forEach((audit) => {
      events.push({
        id: `audit-${audit.id}`,
        eventType: 'TRANSFER',
        title: `System Action: ${audit.action}`,
        description: `Action executed by staff/admin (ID: ${audit.userId}). Details: ${JSON.stringify(audit.details)}`,
        timestamp: audit.createdAt,
        metadata: { action: audit.action, userId: audit.userId },
      });
    });

    // Sort all events descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
