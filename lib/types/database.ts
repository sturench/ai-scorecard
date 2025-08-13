/**
 * Database Types and Interfaces
 *
 * Comprehensive type definitions for AI Scorecard database operations
 * providing type safety and clear contracts for data operations.
 */

import { Assessment, AssessmentSession, HubspotSyncQueue, Prisma } from '@prisma/client';

// Assessment Types
export interface CreateAssessmentInput {
  sessionId: string;
  responses: Record<string, string>;
  totalScore?: number | null;
  scoreBreakdown?: Prisma.JsonValue | null;
  scoreCategory?: string | null;
  recommendations?: string[];
  email?: string | null;
  company?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  companySize?: string | null;
  industry?: string | null;
  completedAt?: Date | null;
  completionTimeSeconds?: number | null;
  stepTimings?: Prisma.JsonValue | null;
  browserInfo?: Prisma.JsonValue | null;
  referrerSource?: string | null;
  abTestVariant?: string | null;
  deviceType?: string | null;
  abandonmentStep?: number | null;
}

export interface AssessmentWithDetails extends Assessment {
  syncQueue?: HubspotSyncQueue[];
}

export interface ScoreCalculation {
  totalScore: number;
  scoreBreakdown: {
    valueAssurance: number;
    customerSafe: number;
    riskCompliance: number;
    governance: number;
  };
  scoreCategory: 'champion' | 'builder' | 'risk_zone' | 'alert' | 'crisis';
  recommendations: string[];
}

// Assessment Session Types
export interface CreateSessionInput {
  userAgent?: string | null;
  ipAddress?: string | null;
  referrer?: string | null;
  abTestVariant?: string | null;
  expiresAt?: Date;
}

export interface UpdateSessionInput {
  currentStep?: number;
  responses?: Record<string, string>;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
}

export interface SessionValidationError {
  field: string;
  message: string;
  code: 'INVALID_STEP' | 'MISSING_RESPONSES' | 'INVALID_EMAIL' | 'INVALID_RESPONSE_VALUE';
}

// HubSpot Sync Types
export interface HubspotSyncOptions {
  priority?: number;
  maxRetries?: number;
}

export interface HubspotSyncResult {
  contactId?: string;
  dealId?: string;
  error?: string;
  errorType?: 'auth_error' | 'rate_limit' | 'validation_error' | 'server_error';
}

export interface SyncQueueEntry extends HubspotSyncQueue {
  assessment?: Assessment;
}

export interface BatchProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    entryId: string;
    error: string;
  }>;
}

// Privacy Compliance Types
export interface DataRetentionConfig {
  emailRetentionDays: number;
  sessionRetentionDays: number;
  analyticsRetentionDays: number;
}

export interface RetentionOperation {
  type: 'email_scrub' | 'session_cleanup' | 'analytics_aggregation';
  retentionDays: number;
  batchSize?: number;
  dryRun?: boolean;
}

export interface RetentionResult {
  operationType: string;
  recordsProcessed: number;
  recordsDeleted: number;
  recordsModified: number;
  errors: string[];
  durationMs: number;
  status: 'completed' | 'failed' | 'partial';
}

export interface GDPRRequest {
  email: string;
  requestType: 'export' | 'delete' | 'consent_withdrawal';
  withdrawalType?: 'full' | 'marketing_only';
}

export interface GDPRExportData {
  user_email: string;
  export_date: string;
  assessments: Array<{
    id: string;
    responses: Record<string, any>;
    total_score: number | null;
    email: string | null;
    created_at: Date;
    completed_at: Date | null;
  }>;
  sessions: Array<{
    id: string;
    started_at: Date;
    completed: boolean;
  }>;
  analytics: Array<{
    event_type: string;
    timestamp: Date;
  }>;
}

// Error Types
export interface DatabaseError {
  code: string;
  message: string;
  details?: Record<string, any>;
  operation: string;
  timestamp: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: SessionValidationError[];
}

// Analytics Types
export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  sessionHash?: string;
  userHash?: string;
  timestamp?: Date;
  page?: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: string;
}

export interface AnalyticsFilter {
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  sessionHash?: string;
  limit?: number;
  offset?: number;
}

// Database Health Types
export interface DatabaseHealth {
  connected: boolean;
  latency?: number;
  error?: string;
  timestamp: Date;
  connectionPool?: {
    size: number;
    used: number;
    idle: number;
  };
}

// Query Options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  filter?: FilterOptions;
  include?: string[];
}

// Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DatabaseOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: DatabaseError;
  metadata?: {
    operation: string;
    timestamp: Date;
    duration: number;
  };
}

// Utility Types
export type AssessmentStatus = 'draft' | 'in_progress' | 'completed' | 'abandoned';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
export type RetentionStatus = 'active' | 'scheduled' | 'scrubbed' | 'deleted';
export type ComplianceLevel = 'compliant' | 'warning' | 'violation';

export interface DatabaseMetrics {
  totalAssessments: number;
  completedAssessments: number;
  activeSessions: number;
  pendingSyncs: number;
  scrubbedRecords: number;
  averageCompletionTime: number;
  conversionRate: number;
}

export interface PerformanceMetrics {
  queryDuration: number;
  connectionLatency: number;
  cacheHitRate: number;
  indexUsage: Record<string, number>;
}
