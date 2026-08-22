import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContextBuilderService } from './context-builder.service';
import { AIProviderService } from './ai-provider.service';
import { ConversationTurn } from '../dto';

/**
 * ChatService
 * ────────────────────────────────────────────────────────────────────────────
 * Main orchestrator for AI chat functionality.
 * Handles: authentication verification, context retrieval, AI generation, logging.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly aiProvider: AIProviderService,
  ) {}

  /**
   * Process a chat message from an authenticated parent user.
   *
   * @param userId Authenticated user ID from JWT
   * @param message User's message text
   * @param conversation Prior conversation history
   * @param childId Optional child ID (ownership verified)
   * @returns AI-generated reply
   */
  async sendMessage(
    userId: string,
    message: string,
    conversation: ConversationTurn[],
    childId?: string,
  ): Promise<string> {
    // 1. Get parent profile from userId
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      select: { id: true, userId: true, verificationStatus: true },
    });

    if (!parent) {
      throw new ForbiddenException('Parent profile not found. Please complete your registration.');
    }

    // 2. Retrieve all relevant context
    const context = await this.contextBuilder.retrieveContext(parent.id, childId);

    // 3. Generate AI reply
    const reply = await this.aiProvider.generateReply(
      message,
      conversation.map((t) => ({ role: t.role, content: t.content })),
      context,
    );

    // 4. Log the conversation (async — don't block response)
    this.logConversation(parent.id, message, reply, childId).catch((err) =>
      this.logger.error('Failed to log conversation:', err),
    );

    return reply;
  }

  /**
   * Log conversation to database for audit and analytics.
   * Stores in AISession + AIConversationMessage tables.
   */
  private async logConversation(
    parentId: string,
    userMessage: string,
    aiReply: string,
    childId?: string,
  ): Promise<void> {
    try {
      // Create or retrieve active session
      let session = await this.prisma.aISession.findFirst({
        where: {
          initiatedById: (await this.prisma.parent.findUnique({ where: { id: parentId } }))?.userId,
          sessionType: 'SAHAYAK_QUERY',
          status: 'IN_PROGRESS',
        },
      });

      if (!session) {
        const parent = await this.prisma.parent.findUnique({
          where: { id: parentId },
          select: { userId: true },
        });

        session = await this.prisma.aISession.create({
          data: {
            sessionType: 'SAHAYAK_QUERY',
            status: 'IN_PROGRESS',
            provider: 'GOOGLE_GEMINI',
            childId,
            initiatedById: parent?.userId,
            startedAt: new Date(),
          },
        });
      }

      // Get current message count for sequence
      const messageCount = await this.prisma.aIConversationMessage.count({
        where: { sessionId: session.id },
      });

      // Store user message
      await this.prisma.aIConversationMessage.create({
        data: {
          sessionId: session.id,
          role: 'USER',
          content: userMessage,
          sequence: messageCount,
        },
      });

      // Store AI reply
      await this.prisma.aIConversationMessage.create({
        data: {
          sessionId: session.id,
          role: 'ASSISTANT',
          content: aiReply,
          sequence: messageCount + 1,
        },
      });

      this.logger.debug(`Conversation logged for parent ${parentId}`);
    } catch (error) {
      this.logger.error('Error logging conversation:', error);
    }
  }

  /**
   * Get conversation history for a parent.
   * Used for session continuation or analytics.
   *
   * @param userId Authenticated user ID
   * @param sessionId Optional session ID (if omitted, returns latest active session)
   * @returns Array of conversation messages
   */
  async getConversationHistory(
    userId: string,
    sessionId?: string,
  ): Promise<Array<{ role: string; content: string; timestamp: Date }>> {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!parent) {
      throw new ForbiddenException('Parent profile not found');
    }

    let session;
    if (sessionId) {
      session = await this.prisma.aISession.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.initiatedById !== parent.userId) {
        throw new ForbiddenException('Access denied to this session');
      }
    } else {
      session = await this.prisma.aISession.findFirst({
        where: {
          initiatedById: parent.userId,
          sessionType: 'SAHAYAK_QUERY',
        },
        orderBy: { startedAt: 'desc' },
      });
    }

    if (!session) {
      return [];
    }

    const messages = await this.prisma.aIConversationMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { sequence: 'asc' },
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return messages.map((m) => ({
      role: m.role.toLowerCase(),
      content: m.content,
      timestamp: m.createdAt,
    }));
  }
}
