import { Injectable, Logger } from '@nestjs/common';
import { Prisma, GuardianRelation } from '@prisma/client';
import { RegisterChildDto } from '../dto/register-child.dto';

@Injectable()
export class ChildDocumentsService {
  private readonly logger = new Logger(ChildDocumentsService.name);

  /**
   * Saves emergency contact as GuardianHistory inside Prisma transaction if provided.
   */
  async saveEmergencyContact(
    prismaTx: Prisma.TransactionClient,
    childId: string,
    dto: RegisterChildDto,
    recordedById: string
  ): Promise<void> {
    if (dto.emergencyContact) {
      const contact = dto.emergencyContact;
      await prismaTx.guardianHistory.create({
        data: {
          childId,
          guardianName: contact.name,
          relation: GuardianRelation.OTHER,
          contactPhone: contact.phone,
          address: contact.address || null,
          isCurrent: true,
          startDate: new Date(),
          reasonForChange: `Initial Emergency Contact (${contact.relationship})`,
          recordedById,
        },
      });
      this.logger.log(`Saved emergency contact for child ${childId}: ${contact.name}`);
    }
  }
}
