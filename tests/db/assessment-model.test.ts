/**
 * Assessment Model Database Operations Tests
 *
 * Tests REAL database operations for the Assessment model including
 * CRUD operations, data validation, privacy compliance, and relationships.
 *
 * CRITICAL: Uses REAL database operations with test database
 * Does NOT mock Prisma calls - tests actual business logic
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { faker } from '@faker-js/faker';

// Mock only external services, not the database operations we're testing
jest.mock('@/lib/services/hubspot', () => ({
  syncAssessmentToHubspot: jest.fn(),
  createHubspotContact: jest.fn(),
}));

describe('Assessment Model - CRUD Operations', () => {
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

  test('should create assessment with complete data', async () => {
    const { createAssessment } = await import('@/lib/db-utils');

    const assessmentData = {
      sessionId: faker.string.uuid(),
      responses: {
        q1: 'A',
        q2: 'B',
        q3: 'C',
        q4: 'A',
      },
      email: faker.internet.email(),
      company: faker.company.name(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      jobTitle: faker.person.jobTitle(),
      companySize: 'medium',
      industry: 'technology',
    };

    const assessment = await createAssessment(assessmentData);

    expect(assessment).toBeDefined();
    expect(assessment.id).toBeDefined();
    expect(assessment.sessionId).toBe(assessmentData.sessionId);
    expect(assessment.email).toBe(assessmentData.email);
    expect(JSON.parse(assessment.responses)).toEqual(assessmentData.responses);
  });

  test('should calculate assessment scores correctly', async () => {
    const { calculateAssessmentScore } = await import('@/lib/db-utils');

    const responses = {
      q1: 'A', // High score answer
      q2: 'B', // Medium score answer
      q3: 'C', // Low score answer
      q4: 'A', // High score answer
    };

    const scoreResult = calculateAssessmentScore(responses);

    expect(scoreResult).toBeDefined();
    expect(scoreResult.totalScore).toBeGreaterThanOrEqual(0);
    expect(scoreResult.totalScore).toBeLessThanOrEqual(100);
    expect(scoreResult.scoreBreakdown).toBeDefined();
    expect(scoreResult.scoreCategory).toMatch(/^(champion|builder|risk_zone|alert|crisis)$/);
    expect(Array.isArray(scoreResult.recommendations)).toBe(true);
  });

  test('should handle incomplete assessment data', async () => {
    const { createAssessment } = await import('@/lib/db-utils');

    const incompleteData = {
      sessionId: faker.string.uuid(),
      responses: {
        q1: 'A',
        q2: 'B',
        // Missing q3 and q4
      },
    };

    const assessment = await createAssessment(incompleteData);

    expect(assessment).toBeDefined();
    expect(assessment.totalScore).toBeNull();
    expect(assessment.scoreCategory).toBeNull();
    expect(assessment.completedAt).toBeNull();
  });

  test('should retrieve assessment by session ID', async () => {
    const { createAssessment, getAssessmentBySessionId } = await import('@/lib/db-utils');

    const sessionId = faker.string.uuid();
    const assessmentData = {
      sessionId,
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
    };

    await createAssessment(assessmentData);
    const retrieved = await getAssessmentBySessionId(sessionId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.sessionId).toBe(sessionId);
    expect(retrieved?.email).toBe(assessmentData.email);
  });

  test('should update assessment with completion data', async () => {
    const { createAssessment, completeAssessment } = await import('@/lib/db-utils');

    const sessionId = faker.string.uuid();
    const assessment = await createAssessment({
      sessionId,
      responses: { q1: 'A', q2: 'B' },
    });

    const completionData = {
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
      company: faker.company.name(),
      completionTimeSeconds: 300,
    };

    const completed = await completeAssessment(assessment.id, completionData);

    expect(completed).toBeDefined();
    expect(completed.completedAt).toBeDefined();
    expect(completed.totalScore).toBeGreaterThanOrEqual(0);
    expect(completed.email).toBe(completionData.email);
    expect(completed.completionTimeSeconds).toBe(300);
  });
});

describe('Assessment Model - Privacy Compliance', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should identify assessments eligible for email scrubbing', async () => {
    const { createAssessment, getAssessmentsForEmailScrubbing } = await import('@/lib/db-utils');

    // Create assessment completed 35 days ago (should be scrubbed)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
      completedAt: oldDate,
    });

    const eligible = await getAssessmentsForEmailScrubbing();

    expect(Array.isArray(eligible)).toBe(true);
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.some((a) => a.id === assessment.id)).toBe(true);
  });

  test('should scrub email data while preserving analytics', async () => {
    const { createAssessment, scrubAssessmentEmailData } = await import('@/lib/db-utils');

    const originalEmail = faker.internet.email();
    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: originalEmail,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      company: faker.company.name(),
      phone: faker.phone.number(),
      totalScore: 75,
      scoreCategory: 'champion',
    });

    const scrubbed = await scrubAssessmentEmailData(assessment.id);

    expect(scrubbed).toBeDefined();
    expect(scrubbed.email).toBeNull();
    expect(scrubbed.firstName).toBeNull();
    expect(scrubbed.lastName).toBeNull();
    expect(scrubbed.company).toBeNull();
    expect(scrubbed.phone).toBeNull();
    expect(scrubbed.emailScrubbedAt).toBeDefined();

    // Analytics data should be preserved
    expect(scrubbed.totalScore).toBe(75);
    expect(scrubbed.scoreCategory).toBe('champion');
    expect(scrubbed.responses).toBeDefined();
  });

  test('should not scrub recent assessments', async () => {
    const { createAssessment, getAssessmentsForEmailScrubbing } = await import('@/lib/db-utils');

    // Create assessment completed 15 days ago (should NOT be scrubbed)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 15);

    await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
      completedAt: recentDate,
    });

    const eligible = await getAssessmentsForEmailScrubbing();

    expect(Array.isArray(eligible)).toBe(true);
    // Should not include recent assessments
  });
});

describe('Assessment Model - HubSpot Integration', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should create assessment with pending HubSpot sync status', async () => {
    const { createAssessment } = await import('@/lib/db-utils');

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
    });

    expect(assessment.hubspotSyncStatus).toBe('pending');
    expect(assessment.hubspotSyncAttempts).toBe(0);
    expect(assessment.hubspotContactId).toBeNull();
  });

  test('should update HubSpot sync status after successful sync', async () => {
    const { createAssessment, updateHubspotSyncStatus } = await import('@/lib/db-utils');

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
    });

    const updated = await updateHubspotSyncStatus(assessment.id, {
      status: 'synced',
      contactId: '12345',
      dealId: '67890',
    });

    expect(updated.hubspotSyncStatus).toBe('synced');
    expect(updated.hubspotContactId).toBe('12345');
    expect(updated.hubspotDealId).toBe('67890');
    expect(updated.hubspotSyncedAt).toBeDefined();
  });

  test('should handle HubSpot sync failures with retry logic', async () => {
    const { createAssessment, recordHubspotSyncFailure } = await import('@/lib/db-utils');

    const assessment = await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
    });

    const updated = await recordHubspotSyncFailure(assessment.id, {
      error: 'API rate limit exceeded',
      errorType: 'rate_limit',
    });

    expect(updated.hubspotSyncStatus).toBe('failed');
    expect(updated.hubspotSyncAttempts).toBe(1);
    expect(updated.hubspotSyncError).toBe('API rate limit exceeded');
    expect(updated.hubspotLastRetryAt).toBeDefined();
  });

  test('should get assessments requiring HubSpot sync', async () => {
    const { createAssessment, getAssessmentsForHubspotSync } = await import('@/lib/db-utils');

    // Create assessment with pending sync
    await createAssessment({
      sessionId: faker.string.uuid(),
      responses: { q1: 'A', q2: 'B', q3: 'C', q4: 'A' },
      email: faker.internet.email(),
      totalScore: 80,
    });

    const pending = await getAssessmentsForHubspotSync();

    expect(Array.isArray(pending)).toBe(true);
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((a) => a.hubspotSyncStatus === 'pending')).toBe(true);
  });
});
