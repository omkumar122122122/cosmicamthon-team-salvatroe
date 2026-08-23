import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    if (typeof (this as any).$use === 'function') {
      (this as any).$use(async (params: any, next: any) => {
        let retries = 2;
        while (retries >= 0) {
          try {
            return await next(params);
          } catch (error: any) {
            const isClosed =
              error?.message?.includes('Closed') ||
              error?.message?.includes('kind: Closed') ||
              error?.message?.includes('Connection closed') ||
              error?.message?.includes('Timed out fetching a new connection') ||
              error?.code === 'P1001' ||
              error?.code === 'P1017' ||
              error?.code === 'P2024';

            if (isClosed && retries > 0) {
              this.logger.warn(
                `Prisma connection closed/dropped ("${error.message}"). Reconnecting Prisma... (${retries} retries left)`,
              );
              retries--;
              try {
                await this.$disconnect();
              } catch { }
              await new Promise((res) => setTimeout(res, 500));
              await this.$connect();
              continue;
            }
            throw error;
          }
        }
      });
    }
  }

  async onModuleInit() {
    let retries = 5;
    let connected = false;
    while (retries > 0 && !connected) {
      try {
        await this.$connect();
        connected = true;
        this.logger.log('Prisma connected to primary database');
      } catch (err: any) {
        retries--;
        if (retries > 0) {
          this.logger.warn(
            `Initial Prisma connection attempt failed (Neon Serverless wake-up/cold start): ${err.message}. Retrying in 1.5s... (${retries} attempts left)`,
          );
          await new Promise((res) => setTimeout(res, 1500));
        } else {
          this.logger.error(`Initial Prisma connection error: ${err.message}`);
        }
      }
    }

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      (this.$on as any)('query', (e: any) => {
        if (e.duration > 200) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  /**
   * Soft-delete helper — sets deletedAt instead of removing the record.
   */
  async softDelete(model: string, id: string): Promise<void> {
    await (this as any)[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Clean up expired tokens — call from a scheduled job.
   */
  async cleanExpiredTokens(): Promise<{ refreshTokens: number; otpTokens: number }> {
    const now = new Date();

    const [refreshTokens, otpTokens] = await Promise.all([
      this.refreshToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { isRevoked: true }] },
      }),
      this.otpToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { isUsed: true }] },
      }),
    ]);

    return { refreshTokens: refreshTokens.count, otpTokens: otpTokens.count };
  }
}
