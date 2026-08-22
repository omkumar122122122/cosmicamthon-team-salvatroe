import { PartialType } from '@nestjs/swagger';
import { CreateParentDto } from './create-parent.dto';

/**
 * All fields from CreateParentDto become optional for PATCH updates.
 */
export class UpdateParentDto extends PartialType(CreateParentDto) {}
