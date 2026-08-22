import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChildrenController } from './children.controller';
import { ChildrenRegistrationController } from './controllers/children-registration.controller';
import { FaceEnrollmentController } from './face-enrollment/controllers/face-enrollment.controller';
import { AttendanceController } from './attendance/controllers/attendance.controller';
import { WellnessController } from './wellness/controllers/wellness.controller';
import { ChildManagementController } from './management/controllers/child-management.controller';

import { ChildrenService } from './children.service';
import { ChildrenRegistrationService } from './services/children-registration.service';
import { ChildrenRepository } from './repositories/children.repository';
import { ChildRegistrationValidator } from './validators/child-registration.validator';

import { ChildMedicalService } from './medical/child-medical.service';
import { ChildAdmissionService } from './admission/child-admission.service';
import { ChildDocumentsService } from './documents/child-documents.service';
import { ChildAttendanceProfileService } from './attendance/child-attendance-profile.service';

import { ChildFaceEnrollmentService } from './face-enrollment/child-face-enrollment.service';
import { FaceQualityValidatorService } from './face-enrollment/services/face-quality-validator.service';
import { FaceEmbeddingGeneratorService } from './face-enrollment/services/face-embedding-generator.service';
import { DuplicateFaceDetectorService } from './face-enrollment/services/duplicate-face-detector.service';
import { ProfilePictureSelectorService } from './face-enrollment/services/profile-picture-selector.service';

import { AttendanceSessionService } from './attendance/services/attendance-session.service';
import { FaceRecognitionMatcherService } from './attendance/services/face-recognition-matcher.service';
import { AttendanceRecorderService } from './attendance/services/attendance-recorder.service';
import { UnknownFaceDetectorService } from './attendance/services/unknown-face-detector.service';
import { AbsentDetectionService } from './attendance/services/absent-detection.service';
import { PythonAiMicroserviceClient } from './attendance/clients/python-ai-microservice.client';

import { ChildWellnessService } from './wellness/child-wellness.service';
import { EmotionDetectorService } from './wellness/services/emotion-detector.service';
import { WellnessCalculatorService } from './wellness/services/wellness-calculator.service';
import { WellnessPatternAnalyzerService } from './wellness/services/wellness-pattern-analyzer.service';
import { WellnessAlertGeneratorService } from './wellness/services/wellness-alert-generator.service';

import { ChildRegistrationNotificationService } from './notifications/child-registration-notification.service';

import { ChildProfileManagementService } from './management/services/child-profile-management.service';
import { ChildSearchFilterService } from './management/services/child-search-filter.service';
import { ChildActivityTimelineService } from './management/services/child-activity-timeline.service';
import { ChildTransferManagementService } from './management/services/child-transfer-management.service';
import { ChildAnalyticsService } from './management/services/child-analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ChildrenController,
    ChildrenRegistrationController,
    FaceEnrollmentController,
    AttendanceController,
    WellnessController,
    ChildManagementController,
  ],
  providers: [
    ChildrenService,
    ChildrenRegistrationService,
    ChildrenRepository,
    ChildRegistrationValidator,
    ChildMedicalService,
    ChildAdmissionService,
    ChildDocumentsService,
    ChildAttendanceProfileService,
    ChildFaceEnrollmentService,
    FaceQualityValidatorService,
    FaceEmbeddingGeneratorService,
    DuplicateFaceDetectorService,
    ProfilePictureSelectorService,
    AttendanceSessionService,
    FaceRecognitionMatcherService,
    AttendanceRecorderService,
    UnknownFaceDetectorService,
    AbsentDetectionService,
    PythonAiMicroserviceClient,
    ChildWellnessService,
    EmotionDetectorService,
    WellnessCalculatorService,
    WellnessPatternAnalyzerService,
    WellnessAlertGeneratorService,
    ChildRegistrationNotificationService,
    ChildProfileManagementService,
    ChildSearchFilterService,
    ChildActivityTimelineService,
    ChildTransferManagementService,
    ChildAnalyticsService,
  ],
  exports: [
    ChildrenService,
    ChildrenRegistrationService,
    ChildFaceEnrollmentService,
    AttendanceSessionService,
    PythonAiMicroserviceClient,
    ChildWellnessService,
    ChildProfileManagementService,
    ChildSearchFilterService,
    ChildActivityTimelineService,
    ChildTransferManagementService,
    ChildAnalyticsService,
    ChildrenRepository,
  ],
})
export class ChildrenModule {}
