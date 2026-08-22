import { Injectable, Logger } from '@nestjs/common';
import { IUnknownFaceEvent } from '../interfaces/attendance-session.interface';
import { ChildRegistrationNotificationService } from '../../notifications/child-registration-notification.service';

@Injectable()
export class UnknownFaceDetectorService {
  private readonly logger = new Logger(UnknownFaceDetectorService.name);
  private unknownEventsLog: IUnknownFaceEvent[] = [];

  constructor(private readonly notificationService: ChildRegistrationNotificationService) {}

  /**
   * Log an unknown face event.
   */
  logUnknownFace(params: {
    sessionId: string;
    orphanageId: string;
    orphanageName: string;
    cameraId?: string;
    confidenceScore: number;
    snapshotUrl?: string;
  }): IUnknownFaceEvent {
    const { sessionId, orphanageId, orphanageName, cameraId, confidenceScore, snapshotUrl } = params;

    const event: IUnknownFaceEvent = {
      id: `UNK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId,
      orphanageId,
      cameraId: cameraId || 'CAM-01',
      confidenceScore,
      snapshotUrl,
      timestamp: new Date(),
    };

    this.unknownEventsLog.push(event);

    this.logger.warn(
      `Unknown face detected in ${orphanageName} (${event.cameraId}) with ${confidenceScore}% max similarity.`
    );

    // If multiple unknown faces detected within session (>3), notify admin
    const sessionUnknowns = this.unknownEventsLog.filter((e) => e.sessionId === sessionId);
    if (sessionUnknowns.length >= 3 && sessionUnknowns.length % 3 === 0) {
      this.notificationService.notifyAdminsOnRegistration({
        childName: `Warning: ${sessionUnknowns.length} Unknown Faces Detected`,
        childCode: 'ALERT-UNKNOWN-FACE',
        orphanageName,
        childId: 'UNKNOWN',
      });
    }

    return event;
  }
}
