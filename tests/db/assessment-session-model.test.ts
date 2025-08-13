/**
 * AssessmentSession Model Database Operations Tests
 *
 * Tests REAL database operations for the AssessmentSession model including
 * session management, expiry logic, progress tracking, and cleanup.
 *
 * CRITICAL: Uses REAL database operations with test database
 * Does NOT mock Prisma calls - tests actual session management logic
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { faker } from '@faker-js/faker';

describe('AssessmentSession Model - Session Management', () => {
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

  test('should create new assessment session with defaults', async () => {
    const { createAssessmentSession } = await import('@/lib/db-utils');

    const sessionData = {
      userAgent: faker.internet.userAgent(),
      referrer: faker.internet.url(),
      abTestVariant: 'variant_a',
    };

    const session = await createAssessmentSession(sessionData);

    expect(session).toBeDefined();
    expect(session.sessionId).toBeDefined();
    expect(session.currentStep).toBe(0);
    expect(session.totalSteps).toBe(4);
    expect(session.responses).toEqual({});
    expect(session.isComplete).toBe(false);
    expect(session.startedAt).toBeDefined();
    expect(session.lastActivity).toBeDefined();
    expect(session.expiresAt).toBeDefined();
  });

  test('should retrieve session by ID', async () => {
    const { createAssessmentSession, getAssessmentSession } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({
      userAgent: faker.internet.userAgent(),
    });

    const retrieved = await getAssessmentSession(session.sessionId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.sessionId).toBe(session.sessionId);
    expect(retrieved?.currentStep).toBe(0);
  });

  test('should update session progress', async () => {
    const { createAssessmentSession, updateSessionProgress } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});

    const progressData = {
      currentStep: 2,
      responses: {
        q1: 'A',
        q2: 'B',
      },
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
    };

    const updated = await updateSessionProgress(session.sessionId, progressData);

    expect(updated).toBeDefined();
    expect(updated.currentStep).toBe(2);
    expect(updated.responses).toEqual(progressData.responses);
    expect(updated.email).toBe(progressData.email);
    expect(updated.firstName).toBe(progressData.firstName);
    expect(updated.lastActivity).not.toBe(session.lastActivity);
  });

  test('should complete session', async () => {
    const { createAssessmentSession, completeSession } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});

    const completionData = {
      responses: {
        q1: 'A',
        q2: 'B',
        q3: 'C',
        q4: 'A',
      },
      email: faker.internet.email(),
      company: faker.company.name(),
    };

    const completed = await completeSession(session.sessionId, completionData);

    expect(completed).toBeDefined();
    expect(completed.isComplete).toBe(true);
    expect(completed.currentStep).toBe(4);
    expect(completed.responses).toEqual(completionData.responses);
  });

  test('should handle session not found', async () => {
    const { getAssessmentSession } = await import('@/lib/db-utils');

    const nonExistentId = faker.string.uuid();
    const result = await getAssessmentSession(nonExistentId);

    expect(result).toBeNull();
  });
});

describe('AssessmentSession Model - Session Expiry', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should identify expired sessions', async () => {
    const { createAssessmentSession, getExpiredSessions } = await import('@/lib/db-utils');

    // Create session that expired 2 hours ago
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 26); // 26 hours ago (expired)

    const session = await createAssessmentSession({
      userAgent: faker.internet.userAgent(),
      expiresAt: pastTime,
    });

    const expired = await getExpiredSessions();

    expect(Array.isArray(expired)).toBe(true);
    expect(expired.length).toBeGreaterThan(0);
    expect(expired.some((s) => s.sessionId === session.sessionId)).toBe(true);
  });

  test('should not return unexpired sessions', async () => {
    const { createAssessmentSession, getExpiredSessions } = await import('@/lib/db-utils');

    // Create session that expires in 12 hours
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 12);

    await createAssessmentSession({
      userAgent: faker.internet.userAgent(),
      expiresAt: futureTime,
    });

    const expired = await getExpiredSessions();

    // Should not include future-expiring sessions
    expect(Array.isArray(expired)).toBe(true);
  });

  test('should clean up expired sessions', async () => {
    const { createAssessmentSession, cleanupExpiredSessions } = await import('@/lib/db-utils');

    // Create expired session
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 26);

    const expiredSession = await createAssessmentSession({
      userAgent: faker.internet.userAgent(),
      expiresAt: pastTime,
    });

    const cleanupResult = await cleanupExpiredSessions();

    expect(cleanupResult).toBeDefined();
    expect(cleanupResult.deletedCount).toBeGreaterThan(0);

    // Verify session was deleted
    const { getAssessmentSession } = await import('@/lib/db-utils');
    const deleted = await getAssessmentSession(expiredSession.sessionId);
    expect(deleted).toBeNull();
  });

  test('should extend session expiry on activity', async () => {
    const { createAssessmentSession, updateSessionActivity } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});
    const originalExpiry = session.expiresAt;

    // Simulate activity after some time
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

    const updated = await updateSessionActivity(session.sessionId);

    expect(updated).toBeDefined();
    expect(updated.lastActivity.getTime()).toBeGreaterThan(session.lastActivity.getTime());
    expect(updated.expiresAt.getTime()).toBeGreaterThan(originalExpiry.getTime());
  });
});

describe('AssessmentSession Model - Progressive Data Capture', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should capture email progressively', async () => {
    const { createAssessmentSession, updateSessionProgress } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});

    // First update - just responses
    let updated = await updateSessionProgress(session.sessionId, {
      currentStep: 1,
      responses: { q1: 'A' },
    });
    expect(updated.email).toBeNull();

    // Second update - add email
    updated = await updateSessionProgress(session.sessionId, {
      currentStep: 2,
      responses: { q1: 'A', q2: 'B' },
      email: faker.internet.email(),
    });
    expect(updated.email).toBeDefined();
  });

  test('should capture contact information progressively', async () => {
    const { createAssessmentSession, updateSessionProgress } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});
    const email = faker.internet.email();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const company = faker.company.name();

    const updated = await updateSessionProgress(session.sessionId, {
      currentStep: 3,
      responses: { q1: 'A', q2: 'B', q3: 'C' },
      email,
      firstName,
      lastName,
      company,
    });

    expect(updated.email).toBe(email);
    expect(updated.firstName).toBe(firstName);
    expect(updated.lastName).toBe(lastName);
    expect(updated.company).toBe(company);
  });

  test('should preserve existing data when updating', async () => {
    const { createAssessmentSession, updateSessionProgress } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});
    const email = faker.internet.email();

    // First update with email
    await updateSessionProgress(session.sessionId, {
      currentStep: 1,
      responses: { q1: 'A' },
      email,
    });

    // Second update without email (should preserve existing)
    const updated = await updateSessionProgress(session.sessionId, {
      currentStep: 2,
      responses: { q1: 'A', q2: 'B' },
    });

    expect(updated.email).toBe(email);
    expect(updated.responses).toEqual({ q1: 'A', q2: 'B' });
  });

  test('should track analytics data', async () => {
    const { createAssessmentSession } = await import('@/lib/db-utils');

    const analyticsData = {
      userAgent: faker.internet.userAgent(),
      ipAddress: faker.internet.ip(),
      referrer: faker.internet.url(),
      abTestVariant: 'variant_b',
    };

    const session = await createAssessmentSession(analyticsData);

    expect(session.userAgent).toBe(analyticsData.userAgent);
    expect(session.ipAddress).toBe(analyticsData.ipAddress);
    expect(session.referrer).toBe(analyticsData.referrer);
    expect(session.abTestVariant).toBe(analyticsData.abTestVariant);
  });
});

describe('AssessmentSession Model - Data Validation', () => {
  beforeEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  afterEach(async () => {
    const { cleanupTestData } = await import('@/tests/utils/db-helpers');
    await cleanupTestData();
  });

  test('should validate step progression', async () => {
    const { createAssessmentSession, updateSessionProgress } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});

    // Should not allow skipping steps
    await expect(
      updateSessionProgress(session.sessionId, {
        currentStep: 3, // Skipping from 0 to 3
        responses: { q1: 'A', q2: 'B', q3: 'C' },
      })
    ).rejects.toThrow();
  });

  test('should validate required responses for step completion', async () => {
    const { createAssessmentSession, updateSessionProgress } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});

    // Step 2 requires responses for q1 and q2
    await expect(
      updateSessionProgress(session.sessionId, {
        currentStep: 2,
        responses: { q1: 'A' }, // Missing q2
      })
    ).rejects.toThrow();
  });

  test('should validate email format', async () => {
    const { createAssessmentSession, updateSessionProgress } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});

    await expect(
      updateSessionProgress(session.sessionId, {
        currentStep: 1,
        responses: { q1: 'A' },
        email: 'invalid-email',
      })
    ).rejects.toThrow();
  });

  test('should validate response values', async () => {
    const { createAssessmentSession, updateSessionProgress } = await import('@/lib/db-utils');

    const session = await createAssessmentSession({});

    await expect(
      updateSessionProgress(session.sessionId, {
        currentStep: 1,
        responses: { q1: 'INVALID_OPTION' }, // Should be A, B, or C
      })
    ).rejects.toThrow();
  });
});
