import { Injectable, Logger } from '@nestjs/common';
import { Prisma, HealthStatus } from '@prisma/client';
import { RegisterChildDto } from '../dto/register-child.dto';

@Injectable()
export class ChildMedicalService {
  private readonly logger = new Logger(ChildMedicalService.name);

  /**
   * Prepares medical fields payload for Child creation.
   */
  prepareMedicalData(dto: RegisterChildDto) {
    return {
      healthStatus: dto.healthStatus || HealthStatus.UNKNOWN,
      hasDisability: dto.hasDisability ?? false,
      disabilityDetails: dto.disabilityDetails || null,
      hasChronicCondition: dto.hasChronicCondition ?? false,
      chronicConditionDetails: dto.chronicConditionDetails || null,
      isVaccinationComplete: dto.isVaccinationComplete ?? false,
      specialNotes: dto.medicalCondition || null,
    };
  }

  /**
   * Optionally creates an initial MedicalHistory entry inside Prisma transaction if medical condition exists.
   */
  async createInitialMedicalRecord(
    prismaTx: Prisma.TransactionClient,
    childId: string,
    dto: RegisterChildDto,
    recordedById: string
  ): Promise<void> {
    if (dto.medicalCondition || dto.hasChronicCondition) {
      await prismaTx.medicalHistory.create({
        data: {
          childId,
          conditionName: dto.chronicConditionDetails || dto.medicalCondition || 'Initial Health Intake',
          isCurrent: true,
          isChronicCondition: dto.hasChronicCondition ?? false,
          notes: dto.medicalCondition || null,
          recordedById,
        },
      });
      this.logger.log(`Created initial medical history for child: ${childId}`);
    }
  }
}
