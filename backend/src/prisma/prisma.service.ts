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
        let retries = 3;
        while (retries >= 0) {
          try {
            return await next(params);
          } catch (error: any) {
            const msg = error?.message || '';
            const isClosed =
              msg.includes('Closed') ||
              msg.includes('kind: Closed') ||
              msg.includes('Connection closed') ||
              msg.includes('57P01') ||
              msg.includes('terminating connection') ||
              msg.includes('administrator command') ||
              msg.includes('server closed the connection unexpectedly') ||
              msg.includes('Connection reset by peer') ||
              error?.code === 'P1001' ||
              error?.code === 'P1017' ||
              error?.code === 'P2024';

            if (isClosed && retries > 0) {
              this.logger.warn(
                `Prisma PostgreSQL connection interrupted ("${msg}"). Re-establishing connection for Neon Serverless... (${retries} retries left)`,
              );
              retries--;
              try {
                await this.$disconnect();
              } catch {}
              await new Promise((res) => setTimeout(res, 1000));
              try {
                await this.$connect();
              } catch (connErr: any) {
                this.logger.warn(`Reconnect attempt error: ${connErr?.message}`);
              }
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
