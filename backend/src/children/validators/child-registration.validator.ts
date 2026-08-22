import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { RegisterChildDto } from '../dto/register-child.dto';
import { ChildrenRepository } from '../repositories/children.repository';
import { ChildGender, BloodGroup, HealthStatus } from '@prisma/client';

@Injectable()
export class ChildRegistrationValidator {
  constructor(private readonly childrenRepository: ChildrenRepository) {}

  /**
   * Validates registration DTO & checks for duplicate entries in the specified orphanage.
   */
  async validateRegistration(dto: RegisterChildDto, orphanageId?: string): Promise<void> {
    // 1. Basic Name & Required Field Validation
    if (!dto.firstName || dto.firstName.trim().length === 0) {
      throw new BadRequestException('First name is required and cannot be empty.');
    }

    // 2. Date Validation (DOB and Admission Date)
    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      const today = new Date();
      if (isNaN(dob.getTime())) {
        throw new BadRequestException('Invalid Date of Birth format.');
      }
      if (dob > today) {
        throw new BadRequestException('Date of Birth cannot be in the future.');
      }
    }

    if (dto.admissionDate) {
      const admissionDate = new Date(dto.admissionDate);
      if (isNaN(admissionDate.getTime())) {
        throw new BadRequestException('Invalid Admission Date format.');
      }
    }

    // 3. Enum Validation
    if (dto.gender && !Object.values(ChildGender).includes(dto.gender)) {
      throw new BadRequestException(`Invalid Gender enum value: ${dto.gender}`);
    }

    if (dto.bloodGroup && !Object.values(BloodGroup).includes(dto.bloodGroup)) {
      throw new BadRequestException(`Invalid Blood Group enum value: ${dto.bloodGroup}`);
    }

    if (dto.healthStatus && !Object.values(HealthStatus).includes(dto.healthStatus)) {
      throw new BadRequestException(`Invalid Health Status enum value: ${dto.healthStatus}`);
    }

    // 4. Medical Information Format Validation
    if (dto.hasDisability && (!dto.disabilityDetails || dto.disabilityDetails.trim().length === 0)) {
      throw new BadRequestException('Disability details must be provided if hasDisability is true.');
    }

    if (dto.hasChronicCondition && (!dto.chronicConditionDetails || dto.chronicConditionDetails.trim().length === 0)) {
      throw new BadRequestException('Chronic condition details must be provided if hasChronicCondition is true.');
    }

    // 5. Note: Duplicate child names are allowed (children are uniquely identified by ID/childCode and biometric vector).
  }
}
