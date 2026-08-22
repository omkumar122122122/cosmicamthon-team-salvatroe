import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAdoptionDto {
  @ApiProperty()
  @IsUUID()
  parentId: string;

  @ApiProperty()
  @IsUUID()
  childId: string;

  @ApiProperty({ description: 'Legal declaration accepted by the submitting officer' })
  @IsBoolean()
  declarationAccepted: boolean;

  @ApiProperty({ required: false })
  @IsString()
  reviewNotes?: string;
}
