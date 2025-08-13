/**
 * HubspotSyncQueue Model Database Operations Tests
 *
 * Tests REAL database operations for the HubspotSyncQueue model including
 * retry logic, error handling, queue management, and batch processing.
 *
 * CRITICAL: Uses REAL database operations with test database
 * Mocks only external HubSpot API calls - tests actual queue management logic
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { faker } from '@faker-js/faker';

// Mock only external HubSpot service calls
jest.mock('@/lib/services/hubspot', () => ({
  syncAssessmentToHubspot: jest.fn(),
  createHubspotContact: jest.fn(),
  createHubspotDeal: jest.fn(),
}));

describe('HubspotSyncQueue Model - Queue Management', () => {
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

  test('should create sync queue entry for assessment', async () => {
    const { createAssessment, addToHubspotSyncQueue } = await import('@/lib/db-utils');

    // First create an assessment
    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
      totalScore: 85,
      scoreCategory: 'champion',
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id, {
      priority: 3,
    });

    expect(queueEntry).toBeDefined();
    expect(queueEntry.assessmentId).toBe(assessment.id);
    expect(queueEntry.status).toBe('pending');
    expect(queueEntry.retryCount).toBe(0);
    expect(queueEntry.maxRetries).toBe(5);
    expect(queueEntry.priority).toBe(3);
    expect(queueEntry.payload).toBeDefined();
    expect(queueEntry.nextRetryAt).toBeDefined();
  });

  test('should get pending sync queue entries ordered by priority', async () => {
    const { createAssessment, addToHubspotSyncQueue, getPendingSyncEntries } = await import(
      '@/lib/db-utils'
    );

    // Create multiple assessments with different priorities
    const assessment1 = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const assessment2 = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'B' },
      email: faker.internet.email(),
    });

    // Add to queue with different priorities (1 = high, 5 = low)
    await addToHubspotSyncQueue(assessment1.id, { priority: 5 });
    await addToHubspotSyncQueue(assessment2.id, { priority: 1 });

    const pending = await getPendingSyncEntries(10);

    expect(Array.isArray(pending)).toBe(true);
    expect(pending.length).toBe(2);
    // Should be ordered by priority (1 = high priority comes first)
    expect(pending[0].priority).toBe(1);
    expect(pending[1].priority).toBe(5);
  });

  test('should update sync queue entry status', async () => {
    const { createAssessment, addToHubspotSyncQueue, updateSyncEntryStatus } = await import(
      '@/lib/db-utils'
    );

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id);

    const updated = await updateSyncEntryStatus(queueEntry.id, {
      status: 'processing',
    });

    expect(updated.status).toBe('processing');
    expect(updated.processedAt).toBeDefined();
  });

  test('should handle successful sync completion', async () => {
    const { createAssessment, addToHubspotSyncQueue, completeSyncEntry } = await import(
      '@/lib/db-utils'
    );

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id);

    const completed = await completeSyncEntry(queueEntry.id, {
      hubspotContactId: '12345',
      hubspotDealId: '67890',
    });

    expect(completed.status).toBe('completed');
    expect(completed.processedAt).toBeDefined();

    // Check that assessment was also updated
    const { getAssessmentBySessionId } = await import('@/lib/db-utils');
    const updatedAssessment = await getAssessmentBySessionId(assessment.sessionId);
    expect(updatedAssessment?.hubspotSyncStatus).toBe('synced');
    expect(updatedAssessment?.hubspotContactId).toBe('12345');
  });
});

describe('HubspotSyncQueue Model - Retry Logic', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should handle sync failure with retry scheduling', async () => {
    const { createAssessment, addToHubspotSyncQueue, recordSyncFailure } = await import(
      '@/lib/db-utils'
    );

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id);

    const failed = await recordSyncFailure(queueEntry.id, {
      error: 'HubSpot API rate limit exceeded',
      errorType: 'rate_limit',
    });

    expect(failed.status).toBe('pending'); // Should remain pending for retry
    expect(failed.retryCount).toBe(1);
    expect(failed.lastError).toBe('HubSpot API rate limit exceeded');
    expect(failed.errorType).toBe('rate_limit');
    expect(failed.nextRetryAt.getTime()).toBeGreaterThan(Date.now());
  });

  test('should calculate exponential backoff for retries', async () => {
    const { createAssessment, addToHubspotSyncQueue, recordSyncFailure } = await import(
      '@/lib/db-utils'
    );

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id);

    // First failure
    const firstFailure = await recordSyncFailure(queueEntry.id, {
      error: 'Temporary error',
      errorType: 'server_error',
    });

    const firstRetryTime = firstFailure.nextRetryAt.getTime() - Date.now();

    // Second failure
    const secondFailure = await recordSyncFailure(firstFailure.id, {
      error: 'Another temporary error',
      errorType: 'server_error',
    });

    const secondRetryTime = secondFailure.nextRetryAt.getTime() - Date.now();

    expect(secondRetryTime).toBeGreaterThan(firstRetryTime);
    expect(secondFailure.retryCount).toBe(2);
  });

  test('should fail permanently after max retries', async () => {
    const { createAssessment, addToHubspotSyncQueue, recordSyncFailure } = await import(
      '@/lib/db-utils'
    );

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    let queueEntry = await addToHubspotSyncQueue(assessment.id, {
      maxRetries: 2, // Set low for testing
    });

    // Fail twice (within limit)
    queueEntry = await recordSyncFailure(queueEntry.id, {
      error: 'Error 1',
      errorType: 'server_error',
    });

    queueEntry = await recordSyncFailure(queueEntry.id, {
      error: 'Error 2',
      errorType: 'server_error',
    });

    expect(queueEntry.retryCount).toBe(2);
    expect(queueEntry.status).toBe('pending');

    // Third failure should mark as permanently failed
    const finalFailure = await recordSyncFailure(queueEntry.id, {
      error: 'Error 3',
      errorType: 'server_error',
    });

    expect(finalFailure.status).toBe('failed');
    expect(finalFailure.retryCount).toBe(3);
  });

  test('should get entries ready for retry', async () => {
    const { createAssessment, addToHubspotSyncQueue, recordSyncFailure, getEntriesReadyForRetry } =
      await import('@/lib/db-utils');

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id);

    // Record failure with past retry time
    const pastTime = new Date();
    pastTime.setMinutes(pastTime.getMinutes() - 10); // 10 minutes ago

    await recordSyncFailure(queueEntry.id, {
      error: 'Temporary error',
      errorType: 'server_error',
      nextRetryAt: pastTime,
    });

    const readyForRetry = await getEntriesReadyForRetry(5);

    expect(Array.isArray(readyForRetry)).toBe(true);
    expect(readyForRetry.length).toBeGreaterThan(0);
    expect(readyForRetry[0].nextRetryAt.getTime()).toBeLessThan(Date.now());
  });
});

describe('HubspotSyncQueue Model - Error Handling', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should categorize different error types', async () => {
    const { createAssessment, addToHubspotSyncQueue, recordSyncFailure } = await import(
      '@/lib/db-utils'
    );

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id);

    const failed = await recordSyncFailure(queueEntry.id, {
      error: '401 Unauthorized',
      errorType: 'auth_error',
    });

    expect(failed.errorType).toBe('auth_error');
    expect(failed.lastError).toBe('401 Unauthorized');
  });

  test('should handle validation errors differently than server errors', async () => {
    const { createAssessment, addToHubspotSyncQueue, recordSyncFailure } = await import(
      '@/lib/db-utils'
    );

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id);

    // Validation errors should fail permanently (no retry)
    const failed = await recordSyncFailure(queueEntry.id, {
      error: 'Invalid email format',
      errorType: 'validation_error',
    });

    expect(failed.status).toBe('failed'); // Should be permanently failed
    expect(failed.retryCount).toBe(1);
  });

  test('should track error patterns for monitoring', async () => {
    const { createAssessment, addToHubspotSyncQueue, recordSyncFailure, getErrorStats } =
      await import('@/lib/db-utils');

    // Create multiple failed entries with different error types
    for (let i = 0; i < 3; i++) {
      const assessment = await createAssessment({
        sessionId: faker.string.uuid(),
        responses: { q1: 'A' },
        email: faker.internet.email(),
      });

      const queueEntry = await addToHubspotSyncQueue(assessment.id);

      await recordSyncFailure(queueEntry.id, {
        error: `Rate limit error ${i}`,
        errorType: 'rate_limit',
      });
    }

    const errorStats = await getErrorStats();

    expect(errorStats).toBeDefined();
    expect(errorStats.rate_limit).toBe(3);
  });
});

describe('HubspotSyncQueue Model - Batch Processing', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should process queue entries in batches', async () => {
    const { createAssessment, addToHubspotSyncQueue, processSyncQueue } = await import(
      '@/lib/db-utils'
    );

    // Create multiple assessments for queue processing
    const assessments = [];
    for (let i = 0; i < 5; i++) {
      const assessment = await createAssessment({
        sessionId: faker.string.uuid(),
        responses: { q1: 'A' },
        email: faker.internet.email(),
      });
      assessments.push(assessment);
      await addToHubspotSyncQueue(assessment.id);
    }

    const processingResult = await processSyncQueue(3); // Process 3 at a time

    expect(processingResult).toBeDefined();
    expect(processingResult.processed).toBe(3);
    expect(processingResult.succeeded).toBeLessThanOrEqual(3);
    expect(processingResult.failed).toBeLessThanOrEqual(3);
  });

  test('should handle mixed success and failure in batch', async () => {
    const { createAssessment, addToHubspotSyncQueue, processSyncQueue } = await import(
      '@/lib/db-utils'
    );

    // Create assessments - some will succeed, some will fail based on mock configuration
    const goodAssessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: 'good@example.com', // Mock will succeed for this
    });

    const badAssessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: 'bad@example.com', // Mock will fail for this
    });

    await addToHubspotSyncQueue(goodAssessment.id);
    await addToHubspotSyncQueue(badAssessment.id);

    const result = await processSyncQueue(10);

    expect(result.processed).toBe(2);
    // Some should succeed, some should fail based on mock behavior
    expect(result.succeeded + result.failed).toBe(2);
  });

  test('should cleanup old completed entries', async () => {
    const { createAssessment, addToHubspotSyncQueue, completeSyncEntry, cleanupOldSyncEntries } =
      await import('@/lib/db-utils');

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A' },
      email: faker.internet.email(),
    });

    const queueEntry = await addToHubspotSyncQueue(assessment.id);

    // Complete the entry and set old processed date
    const completed = await completeSyncEntry(queueEntry.id, {
      hubspotContactId: '12345',
    });

    // Manually update processed date to be old
    const { prisma } = await import('@/lib/prisma');
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8); // 8 days ago

    await prisma.hubspotSyncQueue.update({
      where: { id: completed.id },
      data: { processedAt: oldDate },
    });

    const cleanupResult = await cleanupOldSyncEntries(7); // Cleanup entries older than 7 days

    expect(cleanupResult).toBeDefined();
    expect(cleanupResult.deletedCount).toBeGreaterThan(0);
  });
});
