/**
 * HubSpot Retry Queue Service Tests
 * Testing exponential backoff retry logic and queue management
 *
 * TDD RED Phase: Testing real retry functionality with database operations
 */

import { HubSpotRetryService } from '../../lib/services/hubspot-retry';
import { prisma } from '../../lib/prisma';
import { assessmentResponseFixtures, expectedScoreFixtures } from '../fixtures/assessment-data';
import type {
  CreateAssessmentInput,
  SyncQueueEntry,
  HubspotSyncResult,
} from '../../lib/types/database';

// Real database operations for testing retry functionality
// This ensures we test actual queue management, not mocked behavior

function createMockAssessmentData(
  overrides: Partial<CreateAssessmentInput> = {}
): CreateAssessmentInput {
  return {
    sessionId: 'retry-test-session-123',
    responses: assessmentResponseFixtures.leader,
    totalScore: 78,
    scoreBreakdown: expectedScoreFixtures.leader.scoreBreakdown,
    scoreCategory: 'leader',
    recommendations: expectedScoreFixtures.leader.recommendations,
    email: 'retry@company.com',
    company: 'Retry Corp',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1-555-retry-01',
    completedAt: new Date(),
    completionTimeSeconds: 1200,
    ...overrides,
  };
}

describe('HubSpot Retry Service - Real Queue Management Tests', () => {
  let retryService: HubSpotRetryService;

  beforeAll(async () => {
    // Ensure test database is ready
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.hubspotSyncQueue.deleteMany({
      where: {
        assessment: {
          sessionId: { contains: 'retry-test-' },
        },
      },
    });
    await prisma.assessment.deleteMany({
      where: {
        sessionId: { contains: 'retry-test-' },
      },
    });

    retryService = new HubSpotRetryService();
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await prisma.hubspotSyncQueue.deleteMany({
      where: {
        assessment: {
          sessionId: { contains: 'retry-test-' },
        },
      },
    });
    await prisma.assessment.deleteMany({
      where: {
        sessionId: { contains: 'retry-test-' },
      },
    });
    await prisma.$disconnect();
  });

  describe('Queue Management', () => {
    test('should add assessment to retry queue with default settings', async () => {
      const assessmentData = createMockAssessmentData();

      // First create an assessment record
      const assessment = await prisma.assessment.create({
        data: {
          id: 'test-assessment-001',
          sessionId: assessmentData.sessionId,
          responses: JSON.stringify(assessmentData.responses),
          totalScore: assessmentData.totalScore,
          scoreBreakdown: JSON.stringify(assessmentData.scoreBreakdown),
          email: assessmentData.email,
          firstName: assessmentData.firstName,
          lastName: assessmentData.lastName,
          company: assessmentData.company,
          phone: assessmentData.phone,
        },
      });

      const queueEntry = await retryService.queueForRetry(
        assessment.id,
        assessmentData,
        'rate_limit'
      );

      expect(queueEntry).toBeDefined();
      expect(queueEntry.assessmentId).toBe(assessment.id);
      expect(queueEntry.retryCount).toBe(0);
      expect(queueEntry.maxRetries).toBe(5);
      expect(queueEntry.status).toBe('pending');
      expect(queueEntry.errorType).toBe('rate_limit');
      expect(queueEntry.priority).toBe(5);

      // Verify it's actually in the database
      const dbEntry = await prisma.hubspotSyncQueue.findUnique({
        where: { id: queueEntry.id },
      });
      expect(dbEntry).toBeDefined();
      expect(dbEntry!.payload).toBe(JSON.stringify(assessmentData));
    });

    test('should handle high priority queue entries', async () => {
      const assessmentData = createMockAssessmentData({
        sessionId: 'retry-test-session-high-priority',
      });

      const assessment = await prisma.assessment.create({
        data: {
          id: 'test-assessment-002',
          sessionId: assessmentData.sessionId,
          responses: JSON.stringify(assessmentData.responses),
          totalScore: assessmentData.totalScore,
          email: assessmentData.email,
        },
      });

      const queueEntry = await retryService.queueForRetry(
        assessment.id,
        assessmentData,
        'validation_error',
        { priority: 1, maxRetries: 3 }
      );

      expect(queueEntry.priority).toBe(1);
      expect(queueEntry.maxRetries).toBe(3);
    });
  });

  describe('Exponential Backoff Calculation', () => {
    test('should calculate correct retry delays for exponential backoff', () => {
      const expectedDelays = [
        60, // 1st retry: 60 seconds
        300, // 2nd retry: 5 minutes
        900, // 3rd retry: 15 minutes
        1800, // 4th retry: 30 minutes
        3600, // 5th retry: 1 hour
      ];

      expectedDelays.forEach((expectedDelay, retryCount) => {
        const calculatedDelay = retryService.calculateRetryDelay(retryCount);
        expect(calculatedDelay).toBe(expectedDelay);
      });
    });

    test('should cap max retry delay', () => {
      // Test with very high retry count
      const maxDelay = retryService.calculateRetryDelay(10);
      expect(maxDelay).toBe(3600); // Should cap at 1 hour
    });

    test('should handle retry count of 0', () => {
      const initialDelay = retryService.calculateRetryDelay(0);
      expect(initialDelay).toBe(60); // First retry should be 60 seconds
    });
  });

  describe('Queue Processing', () => {
    test('should process pending queue entries in priority order', async () => {
      // Create multiple queue entries with different priorities
      const assessments = [];
      const queueEntries = [];

      for (let i = 0; i < 3; i++) {
        const assessmentData = createMockAssessmentData({
          sessionId: `retry-test-session-priority-${i}`,
          email: `test-priority-${i}@company.com`,
        });

        const assessment = await prisma.assessment.create({
          data: {
            id: `test-assessment-priority-${i}`,
            sessionId: assessmentData.sessionId,
            responses: JSON.stringify(assessmentData.responses),
            email: assessmentData.email,
          },
        });
        assessments.push(assessment);

        // Create with different priorities (1 = highest, 10 = lowest)
        const queueEntry = await retryService.queueForRetry(
          assessment.id,
          assessmentData,
          'server_error',
          { priority: i === 0 ? 1 : i === 1 ? 5 : 10 }
        );
        queueEntries.push(queueEntry);
      }

      // Get pending entries - should be ordered by priority
      const pendingEntries = await retryService.getPendingEntries(10);

      expect(pendingEntries.length).toBe(3);
      expect(pendingEntries[0].priority).toBe(1); // Highest priority first
      expect(pendingEntries[1].priority).toBe(5);
      expect(pendingEntries[2].priority).toBe(10); // Lowest priority last
    });

    test('should only return entries ready for retry', async () => {
      const assessmentData = createMockAssessmentData({
        sessionId: 'retry-test-session-future',
      });

      const assessment = await prisma.assessment.create({
        data: {
          id: 'test-assessment-future',
          sessionId: assessmentData.sessionId,
          responses: JSON.stringify(assessmentData.responses),
          email: assessmentData.email,
        },
      });

      // Create entry with future retry time
      const futureRetryTime = new Date(Date.now() + 300000); // 5 minutes from now
      await prisma.hubspotSyncQueue.create({
        data: {
          assessmentId: assessment.id,
          payload: JSON.stringify(assessmentData),
          retryCount: 1,
          maxRetries: 5,
          nextRetryAt: futureRetryTime,
          status: 'pending',
          priority: 5,
        },
      });

      const readyEntries = await retryService.getPendingEntries(10);

      // Should not include the future entry
      expect(readyEntries).toHaveLength(0);
    });
  });

  describe('Retry Attempt Processing', () => {
    test('should update retry count and next retry time after failed attempt', async () => {
      const assessmentData = createMockAssessmentData({
        sessionId: 'retry-test-session-update',
      });

      const assessment = await prisma.assessment.create({
        data: {
          id: 'test-assessment-update',
          sessionId: assessmentData.sessionId,
          responses: JSON.stringify(assessmentData.responses),
          email: assessmentData.email,
        },
      });

      const initialEntry = await retryService.queueForRetry(
        assessment.id,
        assessmentData,
        'rate_limit'
      );

      // Simulate a failed retry attempt
      const updatedEntry = await retryService.recordFailedAttempt(
        initialEntry.id,
        'HubSpot API returned 429 - Rate limit exceeded'
      );

      expect(updatedEntry.retryCount).toBe(1);
      expect(updatedEntry.lastError).toBe('HubSpot API returned 429 - Rate limit exceeded');
      expect(updatedEntry.nextRetryAt.getTime()).toBeGreaterThan(Date.now());

      // Should calculate correct next retry time (5 minutes for second attempt)
      const expectedNextRetry = Date.now() + 300 * 1000;
      const actualNextRetry = updatedEntry.nextRetryAt.getTime();
      expect(Math.abs(actualNextRetry - expectedNextRetry)).toBeLessThan(5000); // Within 5 second tolerance
    });

    test('should mark as failed when max retries exceeded', async () => {
      const assessmentData = createMockAssessmentData({
        sessionId: 'retry-test-session-max-retries',
      });

      const assessment = await prisma.assessment.create({
        data: {
          id: 'test-assessment-max-retries',
          sessionId: assessmentData.sessionId,
          responses: JSON.stringify(assessmentData.responses),
          email: assessmentData.email,
        },
      });

      const queueEntry = await retryService.queueForRetry(
        assessment.id,
        assessmentData,
        'server_error',
        { maxRetries: 2 } // Low max for testing
      );

      // Simulate 3 failed attempts (should exceed max of 2)
      let updatedEntry = queueEntry;
      for (let i = 0; i < 3; i++) {
        updatedEntry = await retryService.recordFailedAttempt(
          updatedEntry.id,
          `Attempt ${i + 1} failed`
        );
      }

      expect(updatedEntry.retryCount).toBe(3);
      expect(updatedEntry.status).toBe('failed');
    });
  });

  describe('Success Handling', () => {
    test('should mark queue entry as completed on successful sync', async () => {
      const assessmentData = createMockAssessmentData({
        sessionId: 'retry-test-session-success',
      });

      const assessment = await prisma.assessment.create({
        data: {
          id: 'test-assessment-success',
          sessionId: assessmentData.sessionId,
          responses: JSON.stringify(assessmentData.responses),
          email: assessmentData.email,
        },
      });

      const queueEntry = await retryService.queueForRetry(
        assessment.id,
        assessmentData,
        'auth_error'
      );

      // Simulate successful sync
      const syncResult: HubspotSyncResult = {
        contactId: 'hs-contact-123',
        dealId: 'hs-deal-456',
      };

      const completedEntry = await retryService.recordSuccessfulSync(queueEntry.id, syncResult);

      expect(completedEntry.status).toBe('completed');
      expect(completedEntry.processedAt).toBeDefined();
      expect(completedEntry.processedAt!.getTime()).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds
    });
  });

  describe('Dead Letter Queue', () => {
    test('should identify permanently failed entries', async () => {
      const assessmentData = createMockAssessmentData({
        sessionId: 'retry-test-session-dead-letter',
      });

      const assessment = await prisma.assessment.create({
        data: {
          id: 'test-assessment-dead-letter',
          sessionId: assessmentData.sessionId,
          responses: JSON.stringify(assessmentData.responses),
          email: assessmentData.email,
        },
      });

      // Create already failed entry
      const failedEntry = await prisma.hubspotSyncQueue.create({
        data: {
          assessmentId: assessment.id,
          payload: JSON.stringify(assessmentData),
          retryCount: 5,
          maxRetries: 5,
          status: 'failed',
          lastError: 'Max retries exceeded',
          errorType: 'server_error',
          nextRetryAt: new Date(),
          priority: 5,
        },
      });

      const deadLetterEntries = await retryService.getDeadLetterQueue();

      expect(deadLetterEntries).toHaveLength(1);
      expect(deadLetterEntries[0].id).toBe(failedEntry.id);
      expect(deadLetterEntries[0].status).toBe('failed');
      expect(deadLetterEntries[0].retryCount).toBeGreaterThanOrEqual(
        deadLetterEntries[0].maxRetries
      );
    });
  });

  describe('Batch Processing', () => {
    test('should process multiple queue entries efficiently', async () => {
      // Create multiple queue entries
      const assessments = [];
      for (let i = 0; i < 5; i++) {
        const assessmentData = createMockAssessmentData({
          sessionId: `retry-test-session-batch-${i}`,
          email: `batch-${i}@company.com`,
        });

        const assessment = await prisma.assessment.create({
          data: {
            id: `test-assessment-batch-${i}`,
            sessionId: assessmentData.sessionId,
            responses: JSON.stringify(assessmentData.responses),
            email: assessmentData.email,
          },
        });
        assessments.push(assessment);

        await retryService.queueForRetry(assessment.id, assessmentData, 'rate_limit');
      }

      const batchResult = await retryService.processPendingQueue(3); // Process 3 at a time

      expect(batchResult.processed).toBe(3); // Should process requested batch size
      expect(batchResult.succeeded).toBeGreaterThanOrEqual(0);
      expect(batchResult.failed).toBeGreaterThanOrEqual(0);
      expect(batchResult.succeeded + batchResult.failed).toBe(3);
    });
  });
});
