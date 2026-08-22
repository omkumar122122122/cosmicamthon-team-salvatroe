import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ChatService } from './services/chat.service';
import { SendChatMessageDto, ChatReplyDto } from './dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Roles(Role.PARENT)
  @Throttle({ default: { limit: 30, ttl: 3600000 } }) // 30 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message to YourSathi AI assistant',
    description:
      'Send a message to the AI welfare assistant with automatic context retrieval from the database. ' +
      'The AI will answer questions about child health, vaccinations, KYC status, adoption process, and more. ' +
      'Only authenticated PARENT users can access this endpoint. ' +
      'Rate limit: 30 requests per hour per parent.',
  })
  @ApiResponse({
    status: 200,
    description: 'AI reply successfully generated',
    type: ChatReplyDto,
    example: {
      reply:
        'Based on the records for **Anaya Das** (CH-1034):\n\n' +
        '**Completed Vaccinations:**\n' +
        '- BCG, Hepatitis B, MMR, OPV\n\n' +
        '**⚠️ Overdue:**\n' +
        '- **Typhoid booster** — due 14 Sep 2025\n\n' +
        'I recommend scheduling the booster as soon as possible.',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Only PARENT role can access this endpoint, or parent profile not found',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded — maximum 30 requests per hour',
  })
  @ApiResponse({
    status: 500,
    description: 'AI service temporarily unavailable',
  })
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendChatMessageDto,
  ): Promise<ChatReplyDto> {
    this.logger.log(`Chat request from user ${user.sub} (${user.email})`);

    const reply = await this.chatService.sendMessage(
      user.sub,
      dto.message,
      dto.conversation || [],
      dto.childId,
    );

    return { reply };
  }
}
