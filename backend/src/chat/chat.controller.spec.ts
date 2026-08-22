// Chat controller

import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SendChatMessageDto } from './dto';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  const mockChatService = {
    sendMessage: jest.fn(),
  };

  const mockUser: JwtPayload = {
    sub: 'user-123',
    email: 'parent@example.com',
    role: Role.PARENT,
    type: 'access',
    jti: 'jti-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should call chatService.sendMessage and return reply', async () => {
      const dto = {
        message: 'What is my child\'s vaccination status?',
        conversation: [],
      };

      const expectedReply = 'Your child is up to date with vaccinations.';
      mockChatService.sendMessage.mockResolvedValue(expectedReply);

      const result = await controller.sendMessage(mockUser, dto);

      expect(chatService.sendMessage).toHaveBeenCalledWith(
        mockUser.sub,
        dto.message,
        dto.conversation,
        undefined,
      );
      expect(result).toEqual({ reply: expectedReply });
    });

    it('should pass childId to chatService when provided', async () => {
      const dto = {
        message: 'Show health report',
        conversation: [],
        childId: 'child-456',
      };

      mockChatService.sendMessage.mockResolvedValue('Here is the health report');

      await controller.sendMessage(mockUser, dto);

      expect(chatService.sendMessage).toHaveBeenCalledWith(
        mockUser.sub,
        dto.message,
        dto.conversation,
        'child-456',
      );
    });

    it('should handle conversation history', async () => {
      const dto: SendChatMessageDto = {
        message: 'What about vaccinations?',
        conversation: [
          { role: 'user' as const, content: 'Tell me about my child' },
          { role: 'assistant' as const, content: 'Your child is healthy' },
        ],
      };

      mockChatService.sendMessage.mockResolvedValue('Vaccinations are complete');

      await controller.sendMessage(mockUser, dto);

      expect(chatService.sendMessage).toHaveBeenCalledWith(
        mockUser.sub,
        dto.message,
        dto.conversation,
        undefined,
      );
    });
  });
});
