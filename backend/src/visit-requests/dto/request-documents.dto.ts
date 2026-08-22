import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class RequestDocumentsDto {
  @ApiProperty({
    description: 'Array of missing document types to request',
    example: ['Aadhaar', 'Marriage Certificate', 'Address Proof'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one document must be requested' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  missingDocuments: string[];

  @ApiPropertyOptional({
    description: 'Note to parent about the document request',
    example:
      'Please submit the marked documents within 7 days to proceed with your visit request.',
  })
  @IsString()
  @IsNotEmpty()
  note: string;
}
