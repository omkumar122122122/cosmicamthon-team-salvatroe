import {
  Injectable,
  Logger,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InferenceClient } from "@huggingface/inference";
import { SYSTEM_PROMPT, buildContextString } from "../prompts/system-prompt";
import { RetrievedContext } from "../interfaces/context.interface";

/**
 * AIProviderService
 * ────────────────────────────────────────────────────────────────────────────
 * Handles AI generation using Hugging Face Inference API.
 * Abstracted to support future providers (OpenAI, AWS Bedrock, etc.)
 */
@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);
  private readonly client: InferenceClient | null;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly fallbackModels = [
    "Qwen/Qwen2.5-72B-Instruct",
    "meta-llama/Llama-3.3-70B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
  ];

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      process.env.HF_API_KEY || this.configService.get<string>("HF_API_KEY");

    this.client = apiKey ? new InferenceClient(apiKey) : null;
    this.model = this.configService.get<string>(
      "HF_MODEL",
      "Qwen/Qwen2.5-72B-Instruct",
    );
    this.temperature = parseFloat(
      this.configService.get<string>("AI_TEMPERATURE", "0.7"),
    );
    this.maxTokens = parseInt(
      this.configService.get<string>("AI_MAX_TOKENS", "1024"),
      10,
    );

    if (!apiKey) {
      this.logger.warn(
        "HF_API_KEY is not configured. AI responses will be unavailable until it is set.",
      );
      return;
    }

    this.logger.log(`AI Provider initialized: ${this.model}`);
  }

  /**
   * Generate AI reply using Hugging Face chat completion with full context.
   *
   * @param userMessage Latest user message
   * @param conversation Prior conversation history
   * @param context Retrieved database context
   * @returns AI-generated reply (Markdown)
   */
  async generateReply(
    userMessage: string,
    conversation: Array<{ role: string; content: string }>,
    context: RetrievedContext,
  ): Promise<string> {
    if (!this.client) {
      throw new InternalServerErrorException(
        "Hugging Face AI is not configured. Set HF_API_KEY to enable AI responses.",
      );
    }

    // Build candidate model list starting with configured model
    const candidateModels = Array.from(
      new Set([this.model, ...this.fallbackModels]),
    );

    // Build context string from retrieved data
    const contextBlock = buildContextString(context);

    // Combine system prompt + context
    let systemInstruction = SYSTEM_PROMPT;
    if (contextBlock) {
      systemInstruction += "\n\n" + contextBlock;
    }

    // Convert history to HF Chat Completion format (system / user / assistant roles)
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: systemInstruction },
      ...conversation.map((turn) => ({
        role: (turn.role === "assistant" || turn.role === "model"
          ? "assistant"
          : "user") as "assistant" | "user",
        content: turn.content,
      })),
      { role: "user", content: userMessage },
    ];

    let lastError: any = null;

    for (const targetModel of candidateModels) {
      try {
        this.logger.debug(`Attempting generation with model: ${targetModel}`);
        const response = await this.client.chatCompletion({
          model: targetModel,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        });

        const reply = response.choices?.[0]?.message?.content?.trim();

        if (reply) {
          this.logger.debug(
            `AI reply generated successfully using ${targetModel}: ${reply.length} chars`,
          );
          return reply;
        }
      } catch (error: any) {
        lastError = error;
        const statusCode =
          error?.httpResponse?.status ?? error?.status ?? error?.response?.status;
        const responseBody =
          error?.httpResponse?.body ?? error?.response?.data ?? error?.body;
        const hfErrorMessage =
          responseBody?.error?.message ||
          error?.message ||
          "Unknown Hugging Face error";

        this.logger.warn(
          `Model '${targetModel}' failed [${statusCode || "N/A"}]: ${hfErrorMessage}. Trying fallback if available...`,
        );

        if (this.isQuotaError(error)) {
          throw new HttpException(
            "Sahayak AI rate limit or quota is currently exhausted for the configured Hugging Face API key. Please wait and retry.",
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
    }

    const statusCode =
      lastError?.httpResponse?.status ?? lastError?.status ?? lastError?.response?.status;
    const responseBody =
      lastError?.httpResponse?.body ?? lastError?.response?.data ?? lastError?.body;
    const hfErrorMessage =
      responseBody?.error?.message || lastError?.message || "Unknown Hugging Face error";

    this.logger.error("========== HUGGING FACE ERROR ==========");
    this.logger.error(`Status Code: ${statusCode || "N/A"}`);
    this.logger.error(`Error Message: ${hfErrorMessage}`);
    this.logger.error(`Response Body: ${JSON.stringify(responseBody || {})}`);
    this.logger.error("=========================================");

    throw new InternalServerErrorException(
      `Hugging Face API Error [${statusCode || 500}]: ${hfErrorMessage}`,
    );
  }

  private isQuotaError(error: any): boolean {
    const status = error?.httpResponse?.status ?? error?.status ?? error?.response?.status;
    const message = String(error?.httpResponse?.body?.error?.message ?? error?.message ?? error);

    return (
      status === 429 ||
      status === 402 ||
      message.includes('429') ||
      message.includes('Quota exceeded') ||
      message.includes('rate limit') ||
      message.includes('Too Many Requests')
    );
  }
}
