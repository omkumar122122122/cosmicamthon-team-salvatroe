import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { OrphanagesController } from './orphanages.controller';
import { OrphanagesService } from './orphanages.service';
import { FileUploadService } from './services/file-upload.service';
import { ComplianceCalculatorService } from './services/compliance-calculator.service';
import { GooglePlacesService } from './services/google-places.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    CommonModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [OrphanagesController],
  providers: [
    OrphanagesService,
    FileUploadService,
    ComplianceCalculatorService,
    GooglePlacesService,
  ],
  exports: [OrphanagesService],
})
export class OrphanagesModule { }
