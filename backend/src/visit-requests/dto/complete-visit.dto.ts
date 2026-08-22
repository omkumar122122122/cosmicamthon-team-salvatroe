import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ParentBehaviour {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  AVERAGE = 'Average',
  POOR = 'Poor',
}

export enum ChildComfort {
  COMFORTABLE = 'Comfortable',
  NEUTRAL = 'Neutral',
  UNCOMFORTABLE = 'Uncomfortable',
}

export enum MeetingOutcome {
  SUITABLE_FOR_ADOPTION = 'Suitable for Adoption',
  NEEDS_FURTHER_EVALUATION = 'Needs Further Evaluation',
  NOT_SUITABLE = 'Not Suitable',
  REJECTED = 'Rejected',
}

export enum VisitRecommendation {
  APPROVE_ADOPTION = 'Approve Adoption',
  APPROVE_NEXT_VISIT = 'Approve Visit',
  REQUEST_FOLLOW_UP = 'Request Follow-up',
  ESCALATE_REVIEW = 'Escalate Review',
  REJECT = 'Reject',
}

export class PostVisitFeedbackDto {
  @ApiProperty({
    description: 'Parent behaviour during visit',
    enum: ParentBehaviour,
    example: ParentBehaviour.EXCELLENT,
  })
  @IsEnum(ParentBehaviour)
  @IsNotEmpty()
  parentBehaviour: ParentBehaviour;

  @ApiProperty({
    description: 'Child comfort level during visit',
    enum: ChildComfort,
    example: ChildComfort.COMFORTABLE,
  })
  @IsEnum(ChildComfort)
  @IsNotEmpty()
  childComfort: ChildComfort;

  @ApiProperty({
    description: 'Overall meeting outcome',
    enum: MeetingOutcome,
    example: MeetingOutcome.SUITABLE_FOR_ADOPTION,
  })
  @IsEnum(MeetingOutcome)
  @IsNotEmpty()
  meetingOutcome: MeetingOutcome;

  @ApiProperty({
    description: 'Recommendation for next steps',
    enum: VisitRecommendation,
    example: VisitRecommendation.APPROVE_NEXT_VISIT,
  })
  @IsEnum(VisitRecommendation)
  @IsNotEmpty()
  recommendation: VisitRecommendation;

  @ApiPropertyOptional({
    description: 'Staff notes about the visit',
    example: 'Very positive interaction between parent and child...',
  })
  @IsString()
  @IsOptional()
  staffNotes?: string;
}

export class CompleteVisitDto {
  @ApiProperty({
    description: 'Check-out time (ISO 8601 format)',
    example: '2026-07-20T11:30:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  checkOutTime: string;

  @ApiProperty({
    description: 'Post-visit feedback',
    type: PostVisitFeedbackDto,
  })
  @ValidateNested()
  @Type(() => PostVisitFeedbackDto)
  @IsNotEmpty()
  postVisitFeedback: PostVisitFeedbackDto;
}
