import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrphanageBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ParentDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fatherName: string;

  @ApiProperty()
  motherName: string;

  @ApiProperty()
  fatherPhone: string;

  @ApiProperty()
  motherPhone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  adoptionOrderId: string;

  @ApiProperty()
  followUpOfficer: string;
}

export class ChildBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childCode: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  orphanage: string;

  @ApiProperty()
  risk: string;

  @ApiProperty()
  health: string;

  @ApiProperty()
  attendance: number;

  @ApiPropertyOptional()
  photo?: string | null;
}

export class ChildProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childCode: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  bloodGroup: string;

  @ApiProperty({ type: OrphanageBasicDto })
  orphanage: OrphanageBasicDto;

  @ApiProperty()
  admissionDate: Date;

  @ApiProperty()
  foundCondition: string;

  @ApiProperty()
  foundLocation: string;

  @ApiProperty()
  risk: string;

  @ApiProperty()
  health: string;

  @ApiProperty()
  attendance: number;

  @ApiProperty()
  educationLevel: string;

  @ApiProperty()
  caseWorker: string;

  @ApiPropertyOptional()
  vaccinationStatus?: string;

  @ApiPropertyOptional()
  allergies?: string;

  @ApiPropertyOptional()
  medicalHistory?: string;

  @ApiPropertyOptional()
  medicalHistoryFile?: string;

  @ApiPropertyOptional()
  photo?: string;

  @ApiProperty()
  adopted: boolean;

  @ApiPropertyOptional()
  adoptionDate?: Date;

  @ApiProperty()
  emergencyContact: string;

  @ApiPropertyOptional({ type: ParentDetailsDto })
  parentDetails?: ParentDetailsDto;
}

export class ChildrenSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  highRisk: number;

  @ApiProperty()
  adopted: number;

  @ApiProperty()
  needsReview: number;
}

export class PaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class ChildrenListResponseDto {
  @ApiProperty({ type: [ChildBasicDto] })
  data: ChildBasicDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  @ApiProperty({ type: ChildrenSummaryDto })
  summary: ChildrenSummaryDto;
}

export class CreateChildResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  childCode: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  registeredBy: string;

  @ApiProperty()
  createdAt: Date;
}
