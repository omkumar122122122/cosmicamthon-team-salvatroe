import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { NfcService } from './nfc.service';
import { NfcController } from './nfc.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [NfcController],
  providers: [NfcService],
  exports: [NfcService],
})
export class NfcModule {}
