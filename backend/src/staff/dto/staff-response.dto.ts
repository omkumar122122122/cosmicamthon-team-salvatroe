import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrphanageStaffRole } from '@prisma/client';

export class UserBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  avatar?: string;
}

export class OrphanageBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;
}

export class StaffBasicDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  employeeId?: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: OrphanageStaffRole })
  role: OrphanageStaffRole;

  @ApiPropertyOptional()
  designation?: string;

  @ApiProperty()
  joiningDate: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  orphanageName: string;

  @ApiProperty()
  userEmail: string;

  @ApiPropertyOptional()
  userPhone?: string;
}

export class StaffProfileDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  employeeId?: string;

  @ApiProperty({ enum: OrphanageStaffRole })
  role: OrphanageStaffRole;

  @ApiPropertyOptional()
  designation?: string;

  @ApiProperty()
  joiningDate: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: UserBasicDto })
  user: UserBasicDto;

  @ApiPropertyOptional({ type: OrphanageBasicDto })
  orphanage?: OrphanageBasicDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class StaffSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  inactive: number;

  @ApiProperty()
  administrators: number;

  @ApiProperty()
  caretakers: number;

  @ApiProperty()
  teachers: number;

  @ApiProperty()
  medicalStaff: number;

  @ApiProperty()
  securityGuards: number;

  @ApiProperty()
  other: number;
}

export class StaffListResponseDto {
  @ApiProperty({ type: [StaffBasicDto] })
  data: StaffBasicDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;

  @ApiProperty({ type: StaffSummaryDto })
  summary: StaffSummaryDto;
}

export class CreateStaffResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  employeeId?: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: OrphanageStaffRole })
  role: OrphanageStaffRole;

  @ApiProperty()
  orphanageName: string;

  @ApiProperty()
  createdAt: Date;
}
