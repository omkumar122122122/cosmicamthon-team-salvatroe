import { Module } from '@nestjs/common';
import { ParentsService } from './services/parents.service';
import { DocumentUploadService } from './services/document-upload.service';
import { ParentsController, AdminParentsController } from './parents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ParentsController, AdminParentsController],
  providers: [ParentsService, DocumentUploadService],
  exports: [ParentsService],
})
export class ParentsModule {}