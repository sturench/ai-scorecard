import { PrismaClient } from '@prisma/client';

/**
 * Database testing utilities for integration tests
 * Note: These utilities are designed for integration tests with a real test database
 * Unit tests should use mocked Prisma client from jest.setup.js
 */

let testDb: PrismaClient | null = null;

/**
 * Get or create a test database connection
 * Only use this in integration tests
 */
export const getTestDb = (): PrismaClient => {
  if (!testDb) {
    testDb = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5432/ai_scorecard_test',
        },
      },
    });
  }
  return testDb;
};

/**
 * Clean up all test data from the database
 * Use this in beforeEach or afterEach hooks for integration tests
 */
export const cleanupTestDb = async (): Promise<void> => {
  const db = getTestDb();

  try {
    // Delete in reverse order of dependencies
    await db.assessment.deleteMany();
    await db.assessmentSession.deleteMany();
    await db.hubspotSyncQueue.deleteMany();

    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test database:', error);
    throw error;
  }
};

/**
 * Alias for cleanupTestDb to match test imports
 */
export const cleanupTestData = cleanupTestDb;

/**
 * Disconnect from the test database
 * Use this in afterAll hooks
 */
export const disconnectTestDb = async (): Promise<void> => {
  if (testDb) {
    await testDb.$disconnect();
    testDb = null;
    console.log('✅ Test database disconnected');
  }
};

/**
 * Seed the test database with initial data
 * Use this for integration tests that need specific data scenarios
 */
export const seedTestDb = async (scenario: 'minimal' | 'full' = 'minimal'): Promise<void> => {
  const db = getTestDb();

  try {
    if (scenario === 'full') {
      // Create sample assessment sessions
      await db.assessmentSession.createMany({
        data: [
          {
            sessionId: 'test-session-1',
            startedAt: new Date(),
            lastActivity: new Date(),
            currentStep: 1,
            isComplete: false,
            responses: '{}',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          },
          {
            sessionId: 'test-session-2',
            startedAt: new Date(Date.now() - 3600000), // 1 hour ago
            lastActivity: new Date(Date.now() - 1800000), // 30 minutes ago
            currentStep: 3,
            isComplete: false,
            responses: JSON.stringify({
              value_assurance_1: 'A',
              value_assurance_2: 'B',
              customer_safe_1: 'A',
            }),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            company: 'Test Corp',
          },
          {
            sessionId: 'test-session-completed',
            startedAt: new Date(Date.now() - 7200000), // 2 hours ago
            lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
            currentStep: 4,
            isComplete: true,
            responses: JSON.stringify({
              value_assurance_1: 'A',
              value_assurance_2: 'A',
              value_assurance_3: 'B',
              value_assurance_4: 'A',
              customer_safe_1: 'A',
              customer_safe_2: 'A',
              customer_safe_3: 'B',
              customer_safe_4: 'A',
              customer_safe_5: 'A',
              risk_compliance_1: 'B',
              risk_compliance_2: 'B',
              risk_compliance_3: 'A',
              risk_compliance_4: 'B',
              governance_1: 'B',
              governance_2: 'A',
              governance_3: 'B',
            }),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            company: 'Innovation Inc',
          },
        ],
      });

      // Create corresponding assessment for completed session
      const assessment = await db.assessment.create({
        data: {
          sessionId: 'test-session-completed',
          responses: JSON.stringify({
            value_assurance_1: 'A',
            value_assurance_2: 'A',
            customer_safe_1: 'A',
            risk_compliance_1: 'B',
            governance_1: 'B',
          }),
          totalScore: 85,
          scoreBreakdown: JSON.stringify({
            valueAssurance: 88,
            customerSafe: 90,
            riskCompliance: 75,
            governance: 80,
          }),
          scoreCategory: 'leader',
          recommendations: JSON.stringify([
            'Continue leveraging your strong AI governance foundation',
            'Focus on expanding customer-safe AI practices across all business units',
            'Consider advanced compliance automation tools',
          ]),
        },
      });

      // Create sample HubSpot sync queue items
      await db.hubspotSyncQueue.createMany({
        data: [
          {
            assessmentId: assessment.id,
            payload: JSON.stringify({
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com',
              company: 'Innovation Inc',
            }),
            status: 'completed',
            retryCount: 1,
            nextRetryAt: new Date(),
          },
          {
            assessmentId: assessment.id,
            payload: JSON.stringify({
              dealName: 'AI Readiness Assessment - Innovation Inc',
              amount: 25000,
              associatedContactId: '12345',
            }),
            status: 'completed',
            retryCount: 1,
            nextRetryAt: new Date(),
          },
        ],
      });
    }

    console.log(`✅ Test database seeded with ${scenario} data`);
  } catch (error) {
    console.error('❌ Error seeding test database:', error);
    throw error;
  }
};

/**
 * Get the count of records in each table
 * Useful for verifying test database state
 */
export const getTestDbCounts = async () => {
  const db = getTestDb();

  const counts = {
    assessments: await db.assessment.count(),
    assessmentSessions: await db.assessmentSession.count(),
    hubspotSyncQueue: await db.hubspotSyncQueue.count(),
  };

  console.log('📊 Test database counts:', counts);
  return counts;
};

/**
 * Create a test database transaction
 * Use this for tests that need to rollback changes
 */
export const createTestTransaction = async <T>(
  callback: (db: PrismaClient) => Promise<T>
): Promise<T> => {
  const db = getTestDb();

  return await db.$transaction(async (tx) => {
    const result = await callback(tx as PrismaClient);
    // Transaction will be rolled back if an error occurs
    return result;
  });
};

/**
 * Wait for database operations to complete
 * Useful for testing async operations
 */
export const waitForDbOperation = async (
  operation: () => Promise<boolean>,
  maxWaitMs = 5000,
  intervalMs = 100
): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    if (await operation()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
};
