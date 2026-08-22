import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';
import { ContextBuilderService } from './services/context-builder.service';
import { AIProviderService } from './services/ai-provider.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ChatController],
  providers: [ChatService, ContextBuilderService, AIProviderService],
  exports: [ChatService],
})
export class ChatModule {}
