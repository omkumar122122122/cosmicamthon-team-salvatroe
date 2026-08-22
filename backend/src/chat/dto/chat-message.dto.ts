import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConversationTurn {
  @ApiProperty({ description: 'Message role', enum: ['user', 'model', 'assistant'] })
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'model' | 'assistant';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class SendChatMessageDto {
  @ApiProperty({
    description: 'User message text',
    example: 'What is my child\'s vaccination status?',
    maxLength: 4000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000, { message: 'Message must not exceed 4000 characters' })
  message: string;

  @ApiPropertyOptional({
    description: 'Conversation history for multi-turn context',
    type: [ConversationTurn],
    example: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi! How can I help you today?' },
    ],
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(50, { message: 'Conversation history cannot exceed 50 turns' })
  @ValidateNested({ each: true })
  @Type(() => ConversationTurn)
  conversation?: ConversationTurn[];

  @ApiPropertyOptional({
    description: 'Child ID for personalized context (system will verify ownership)',
    example: 'clx7w9z8b0001xyzabc123456',
  })
  @IsString()
  @IsOptional()
  childId?: string;
}

export class ChatReplyDto {
  @ApiProperty({
    description: 'AI-generated reply (may contain Markdown)',
    example: 'Based on the records for **Anaya Das**, all primary vaccinations are complete...',
  })
  reply: string;
}
