/**
 * Privacy Compliance Database Operations Tests
 *
 * Tests REAL database operations for privacy compliance including
 * data retention, automated scrubbing, audit logging, and GDPR compliance.
 *
 * CRITICAL: Uses REAL database operations with test database
 * Tests actual privacy compliance business logic
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { faker } from '@faker-js/faker';

describe('Privacy Compliance - Data Retention', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should identify assessments requiring email data scrubbing', async () => {
    const { createAssessment, getAssessmentsForDataRetention } = await import('@/lib/db-utils');

    // Create assessment completed 35 days ago (past 30-day retention)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);

    const oldAssessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      company: faker.company.name(),
      completedAt: oldDate,
      totalScore: 75,
    });

    // Create recent assessment (should not be flagged)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 15);

    await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
      completedAt: recentDate,
    });

    const retentionData = await getAssessmentsForDataRetention({
      retentionDays: 30,
      operation: 'email_scrub',
    });

    expect(retentionData).toBeDefined();
    expect(Array.isArray(retentionData.assessments)).toBe(true);
    expect(retentionData.assessments.length).toBeGreaterThan(0);
    expect(retentionData.assessments.some((a) => a.id === oldAssessment.id)).toBe(true);
  });

  test('should perform bulk email data scrubbing operation', async () => {
    const { createAssessment, performBulkEmailScrubbing } = await import('@/lib/db-utils');

    // Create multiple old assessments
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);

    const assessments = [];
    for (let i = 0; i < 3; i++) {
      const assessment = await createAssessment({
        sessionId: faker.string.uuid(),
        responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        company: faker.company.name(),
        phone: faker.phone.number(),
        completedAt: oldDate,
        totalScore: 70 + i * 5,
      });
      assessments.push(assessment);
    }

    const scrubResult = await performBulkEmailScrubbing({
      retentionDays: 30,
      batchSize: 10,
    });

    expect(scrubResult).toBeDefined();
    expect(scrubResult.processedCount).toBe(3);
    expect(scrubResult.scrubbedCount).toBe(3);
    expect(scrubResult.errors).toEqual([]);

    // Verify data was actually scrubbed
    const { getAssessmentBySessionId } = await import('@/lib/db-utils');
    const scrubbedAssessment = await getAssessmentBySessionId(assessments[0].sessionId);

    expect(scrubbedAssessment?.email).toBeNull();
    expect(scrubbedAssessment?.firstName).toBeNull();
    expect(scrubbedAssessment?.lastName).toBeNull();
    expect(scrubbedAssessment?.company).toBeNull();
    expect(scrubbedAssessment?.phone).toBeNull();
    expect(scrubbedAssessment?.emailScrubbedAt).toBeDefined();

    // Analytics data should be preserved
    expect(scrubbedAssessment?.totalScore).toBe(70);
    expect(scrubbedAssessment?.responses).toBeDefined();
    expect(scrubbedAssessment?.scoreCategory).toBeDefined();
  });

  test('should clean up expired assessment sessions', async () => {
    const { createAssessmentSession, cleanupExpiredSessions } = await import('@/lib/db-utils');

    // Create expired session (25 hours old, expires after 24 hours)
    const expiredTime = new Date();
    expiredTime.setHours(expiredTime.getHours() - 25);

    const expiredSession = await createAssessmentSession({
      userAgent: faker.internet.userAgent(),
      expiresAt: expiredTime,
    });

    // Create active session
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 12);

    await createAssessmentSession({
      userAgent: faker.internet.userAgent(),
      expiresAt: futureTime,
    });

    const cleanupResult = await cleanupExpiredSessions();

    expect(cleanupResult).toBeDefined();
    expect(cleanupResult.deletedCount).toBeGreaterThan(0);

    // Verify expired session was deleted
    const { getAssessmentSession } = await import('@/lib/db-utils');
    const deletedSession = await getAssessmentSession(expiredSession.sessionId);
    expect(deletedSession).toBeNull();
  });

  test('should aggregate and cleanup old analytics events', async () => {
    const { createAnalyticsEvent, aggregateAndCleanupAnalytics } = await import('@/lib/db-utils');

    // Create old analytics events (older than 365 days)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 400);

    for (let i = 0; i < 5; i++) {
      await createAnalyticsEvent({
        eventType: 'assessment_completed',
        eventData: { score: 70 + i * 5 },
        sessionHash: faker.string.alphanumeric(32),
        timestamp: oldDate,
      });
    }

    const aggregateResult = await aggregateAndCleanupAnalytics({
      retentionDays: 365,
      aggregationLevel: 'daily',
    });

    expect(aggregateResult).toBeDefined();
    expect(aggregateResult.eventsProcessed).toBe(5);
    expect(aggregateResult.eventsDeleted).toBe(5);
    expect(aggregateResult.aggregationsCreated).toBeGreaterThan(0);
  });
});

describe('Privacy Compliance - Audit Logging', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should log data retention operations', async () => {
    const { createAssessment, performBulkEmailScrubbing, getDataRetentionLogs } = await import(
      '@/lib/db-utils'
    );

    // Create assessment for scrubbing
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);

    await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
      completedAt: oldDate,
    });

    await performBulkEmailScrubbing({ retentionDays: 30, batchSize: 10 });

    const logs = await getDataRetentionLogs({
      operationType: 'email_scrub',
      limit: 10,
    });

    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);

    const log = logs[0];
    expect(log.operationType).toBe('email_scrub');
    expect(log.recordsProcessed).toBeGreaterThan(0);
    expect(log.recordsDeleted).toBeGreaterThan(0);
    expect(log.status).toBe('completed');
    expect(log.executedAt).toBeDefined();
    expect(log.durationMs).toBeGreaterThan(0);
  });

  test('should log session cleanup operations', async () => {
    const { createAssessmentSession, cleanupExpiredSessions, getDataRetentionLogs } = await import(
      '@/lib/db-utils'
    );

    // Create expired session
    const expiredTime = new Date();
    expiredTime.setHours(expiredTime.getHours() - 25);

    await createAssessmentSession({
      userAgent: faker.internet.userAgent(),
      expiresAt: expiredTime,
    });

    await cleanupExpiredSessions();

    const logs = await getDataRetentionLogs({
      operationType: 'session_cleanup',
      limit: 10,
    });

    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);

    const log = logs[0];
    expect(log.operationType).toBe('session_cleanup');
    expect(log.status).toBe('completed');
  });

  test('should log failed retention operations', async () => {
    const { logDataRetentionOperation } = await import('@/lib/db-utils');

    const failedLog = await logDataRetentionOperation({
      operationType: 'email_scrub',
      recordsProcessed: 5,
      recordsDeleted: 0,
      status: 'failed',
      errorMessage: 'Database connection timeout',
      durationMs: 5000,
    });

    expect(failedLog).toBeDefined();
    expect(failedLog.operationType).toBe('email_scrub');
    expect(failedLog.status).toBe('failed');
    expect(failedLog.errorMessage).toBe('Database connection timeout');
  });

  test('should retrieve retention logs with filtering', async () => {
    const { logDataRetentionOperation, getDataRetentionLogs } = await import('@/lib/db-utils');

    // Create multiple log entries
    await logDataRetentionOperation({
      operationType: 'email_scrub',
      recordsProcessed: 10,
      recordsDeleted: 10,
      status: 'completed',
      durationMs: 2000,
    });

    await logDataRetentionOperation({
      operationType: 'session_cleanup',
      recordsProcessed: 5,
      recordsDeleted: 5,
      status: 'completed',
      durationMs: 1000,
    });

    const emailLogs = await getDataRetentionLogs({
      operationType: 'email_scrub',
      limit: 10,
    });

    const sessionLogs = await getDataRetentionLogs({
      operationType: 'session_cleanup',
      limit: 10,
    });

    expect(emailLogs.every((log) => log.operationType === 'email_scrub')).toBe(true);
    expect(sessionLogs.every((log) => log.operationType === 'session_cleanup')).toBe(true);
  });
});

describe('Privacy Compliance - GDPR Rights', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should export user data for GDPR data portability', async () => {
    const { createAssessment, exportUserData } = await import('@/lib/db-utils');

    const userEmail = faker.internet.email();

    // Create multiple assessments for the same user
    const assessments = [];
    for (let i = 0; i < 3; i++) {
      const assessment = await createAssessment({
        sessionId: faker.string.uuid(),
        responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
        email: userEmail,
        firstName: faker.person.firstName(),
        company: faker.company.name(),
        totalScore: 70 + i * 10,
      });
      assessments.push(assessment);
    }

    const exportData = await exportUserData(userEmail);

    expect(exportData).toBeDefined();
    expect(exportData.user_email).toBe(userEmail);
    expect(Array.isArray(exportData.assessments)).toBe(true);
    expect(exportData.assessments.length).toBe(3);

    // Check that sensitive data is included (since this is for the user)
    const firstAssessment = exportData.assessments[0];
    expect(firstAssessment.responses).toBeDefined();
    expect(firstAssessment.total_score).toBeDefined();
    expect(firstAssessment.email).toBe(userEmail);
  });

  test('should delete all user data for GDPR right to be forgotten', async () => {
    const { createAssessment, deleteUserData } = await import('@/lib/db-utils');

    const userEmail = faker.internet.email();

    // Create assessments for the user
    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: userEmail,
      firstName: faker.person.firstName(),
      totalScore: 85,
    });

    const deletionResult = await deleteUserData(userEmail);

    expect(deletionResult).toBeDefined();
    expect(deletionResult.assessments_deleted).toBe(1);
    expect(deletionResult.sessions_deleted).toBeGreaterThanOrEqual(0);
    expect(deletionResult.analytics_anonymized).toBeGreaterThanOrEqual(0);

    // Verify data was deleted
    const { getAssessmentBySessionId } = await import('@/lib/db-utils');
    const deletedAssessment = await getAssessmentBySessionId(assessment.sessionId);
    expect(deletedAssessment).toBeNull();
  });

  test('should anonymize analytics data during user deletion', async () => {
    const { createAnalyticsEvent, createAssessment, deleteUserData, getAnalyticsEvents } =
      await import('@/lib/db-utils');

    const userEmail = faker.internet.email();
    const userHash = faker.string.alphanumeric(32);

    // Create assessment and analytics for user
    await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: userEmail,
    });

    await createAnalyticsEvent({
      eventType: 'assessment_completed',
      eventData: { score: 85 },
      userHash: userHash,
    });

    await deleteUserData(userEmail);

    // Analytics should still exist but be anonymized
    const analytics = await getAnalyticsEvents({
      eventType: 'assessment_completed',
      limit: 10,
    });

    expect(analytics.length).toBeGreaterThan(0);
    // userHash should be anonymized (not the original)
    expect(analytics[0].userHash).not.toBe(userHash);
  });

  test('should handle consent withdrawal processing', async () => {
    const { createAssessment, processConsentWithdrawal } = await import('@/lib/db-utils');

    const userEmail = faker.internet.email();

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: userEmail,
      firstName: faker.person.firstName(),
      totalScore: 90,
      hubspotSyncStatus: 'synced',
      hubspotContactId: '12345',
    });

    const withdrawalResult = await processConsentWithdrawal({
      email: userEmail,
      withdrawalType: 'marketing_only', // Keep assessment data, remove marketing consent
    });

    expect(withdrawalResult).toBeDefined();
    expect(withdrawalResult.marketing_data_removed).toBe(true);
    expect(withdrawalResult.assessment_data_preserved).toBe(true);

    // Check that HubSpot sync was marked for removal but assessment preserved
    const { getAssessmentBySessionId } = await import('@/lib/db-utils');
    const updatedAssessment = await getAssessmentBySessionId(assessment.sessionId);
    expect(updatedAssessment).toBeDefined();
    expect(updatedAssessment?.totalScore).toBe(90); // Preserved
    expect(updatedAssessment?.hubspotSyncStatus).toBe('consent_withdrawn');
  });
});
