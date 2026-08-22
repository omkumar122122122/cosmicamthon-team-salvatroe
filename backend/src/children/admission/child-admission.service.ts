import { Injectable, Logger } from '@nestjs/common';
import { RegisterChildDto } from '../dto/register-child.dto';

@Injectable()
export class ChildAdmissionService {
  private readonly logger = new Logger(ChildAdmissionService.name);

  /**
   * Formats admission & rescue fields for Child creation.
   */
  prepareAdmissionData(dto: RegisterChildDto, orphanageId: string) {
    const admissionDate = dto.admissionDate ? new Date(dto.admissionDate) : new Date();

    const notesParts: string[] = [];
    if (dto.roomNo) notesParts.push(`Housing Room: ${dto.roomNo}`);
    if (dto.caretaker) notesParts.push(`Assigned Caretaker: ${dto.caretaker}`);
    if (dto.classSchool) notesParts.push(`School: ${dto.classSchool}`);
    if (dto.legalRescueDetails?.caseNo) notesParts.push(`Case No: ${dto.legalRescueDetails.caseNo}`);
    if (dto.legalRescueDetails?.firNo) notesParts.push(`FIR No: ${dto.legalRescueDetails.firNo}`);
    if (dto.legalRescueDetails?.rescueAgency) notesParts.push(`Rescue Agency: ${dto.legalRescueDetails.rescueAgency}`);

    return {
      orphanageId,
      admissionDate,
      admissionReason: dto.admissionReason || 'Child welfare intake registration',
      entrySource: dto.entrySource || 'Found alone / Abandoned',
      foundLocation: dto.foundLocation || null,
      foundDistrict: dto.foundDistrict || null,
      foundState: dto.foundState || null,
      internalNotes: notesParts.length > 0 ? notesParts.join(' | ') : null,
    };
  }
}
