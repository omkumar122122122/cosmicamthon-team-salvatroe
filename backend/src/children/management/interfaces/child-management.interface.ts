export interface ITimelineEvent {
  id: string;
  eventType: 'REGISTRATION' | 'BIOMETRIC_ENROLLMENT' | 'MEDICAL_RECORD' | 'ATTENDANCE' | 'WELLNESS_EVALUATION' | 'DOCUMENT_UPLOAD' | 'TRANSFER';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

export interface ITransferRequestState {
  transferId: string;
  childId: string;
  childCode: string;
  childName: string;
  fromOrphanageId: string;
  fromOrphanageName: string;
  toOrphanageId: string;
  toOrphanageName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedByUserId: string;
  requestedAt: Date;
  reviewedByUserId?: string;
  reviewedAt?: Date;
}
