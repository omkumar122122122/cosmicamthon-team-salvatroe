/**
 * Aggregated context retrieved for a single chat request.
 * All data fetched from the database before calling the AI.
 */
export interface RetrievedContext {
  parentProfile?: Record<string, any>;
  kycStatus?: Record<string, any>;
  childProfile?: Record<string, any>;
  healthReports?: Array<Record<string, any>>;
  vaccinations?: Array<Record<string, any>>;
  appointments?: Array<Record<string, any>>;
  visitRequests?: Array<Record<string, any>>;
  adoptionStatus?: Record<string, any>;
  notifications?: Array<Record<string, any>>;
}

/**
 * Chat session metadata stored in database.
 */
export interface ChatSessionMetadata {
  parentId: string;
  childId?: string;
  sessionStartedAt: Date;
  messageCount: number;
  tokensUsed: number;
  model: string;
  provider: string;
}
