import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisitRequestStatus, RiskLevel } from '@prisma/client';

export class ParentBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  age?: number;

  @ApiPropertyOptional()
  occupation?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  familyMembers?: string;

  @ApiPropertyOptional()
  income?: string;
}

export class OrphanageBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  address?: string;
}

export class ChildBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childCode: string;

  @ApiProperty()
  firstName: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  age?: number;

  @ApiPropertyOptional()
  gender?: string;
}

export class VisitRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requestId: string;

  @ApiProperty()
  parentId: string;

  @ApiProperty()
  orphanageId: string;

  @ApiPropertyOptional()
  childId?: string;

  @ApiProperty()
  visitDate: Date;

  @ApiProperty()
  visitTime: string;

  @ApiProperty()
  purpose: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  adoptionTimeline?: string;

  @ApiProperty()
  visitorsCount: number;

  @ApiPropertyOptional()
  relationshipOfVisitors?: string;

  @ApiPropertyOptional()
  specialRequirements?: string;

  @ApiPropertyOptional()
  familyBackground?: string;

  @ApiProperty({ enum: VisitRequestStatus })
  status: VisitRequestStatus;

  @ApiProperty({ enum: RiskLevel })
  riskLevel: RiskLevel;

  @ApiProperty()
  trustScore: number;

  @ApiProperty()
  faceMatch: number;

  @ApiPropertyOptional()
  documentAuthenticity?: string;

  @ApiPropertyOptional()
  behaviourPrediction?: string;

  @ApiPropertyOptional()
  adoptionReadiness?: string;

  @ApiPropertyOptional()
  recommendation?: string;

  @ApiPropertyOptional()
  verification?: any;

  @ApiPropertyOptional()
  meetingRoom?: string;

  @ApiPropertyOptional()
  assignedStaff?: string;

  @ApiProperty()
  qrStatus: string;

  @ApiPropertyOptional()
  qrCode?: string;

  @ApiPropertyOptional()
  checkInTime?: Date;

  @ApiPropertyOptional()
  checkOutTime?: Date;

  @ApiPropertyOptional()
  expectedArrivalTime?: string;

  @ApiPropertyOptional()
  uploadedDocuments?: string[];

  @ApiPropertyOptional()
  missingDocuments?: string[];

  @ApiPropertyOptional()
  reviewedById?: string;

  @ApiPropertyOptional()
  reviewedAt?: Date;

  @ApiPropertyOptional()
  approvalNotes?: string;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  rejectionComments?: string;

  @ApiPropertyOptional()
  originalVisitDate?: Date;

  @ApiPropertyOptional()
  originalVisitTime?: string;

  @ApiPropertyOptional()
  rescheduleReason?: string;

  @ApiProperty()
  rescheduleCount: number;

  @ApiPropertyOptional()
  postVisitFeedback?: any;

  @ApiProperty()
  parentNotified: boolean;

  @ApiPropertyOptional()
  notifiedAt?: Date;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiProperty()
  agreedToRules: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: ParentBasicDto })
  parent: ParentBasicDto;

  @ApiProperty({ type: OrphanageBasicDto })
  orphanage: OrphanageBasicDto;

  @ApiPropertyOptional({ type: ChildBasicDto })
  child?: ChildBasicDto;
}

export class VisitRequestListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requestId: string;

  @ApiProperty()
  parentId: string;

  @ApiProperty()
  orphanageId: string;

  @ApiPropertyOptional()
  childId?: string;

  @ApiProperty()
  visitDate: Date;

  @ApiProperty()
  visitTime: string;

  @ApiProperty()
  purpose: string;

  @ApiProperty({ enum: VisitRequestStatus })
  status: VisitRequestStatus;

  @ApiProperty({ enum: RiskLevel })
  riskLevel: RiskLevel;

  @ApiProperty()
  trustScore: number;

  @ApiProperty()
  faceMatch: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: ParentBasicDto })
  parent: ParentBasicDto;

  @ApiProperty({ type: OrphanageBasicDto })
  orphanage: OrphanageBasicDto;

  @ApiPropertyOptional({ type: ChildBasicDto })
  child?: ChildBasicDto;
}

export class VisitRequestSummaryDto {
  @ApiProperty()
  pending: number;

  @ApiProperty()
  today: number;

  @ApiProperty()
  approved: number;

  @ApiProperty()
  rejected: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  highRisk: number;

  @ApiProperty()
  rescheduled: number;

  @ApiProperty()
  cancelled: number;
}

export class VisitRequestListResponseDto {
  @ApiProperty({ type: [VisitRequestListItemDto] })
  data: VisitRequestListItemDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ type: VisitRequestSummaryDto })
  summary: VisitRequestSummaryDto;
}
