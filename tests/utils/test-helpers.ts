import { faker } from '@faker-js/faker';
import { Assessment, AssessmentSession, AssessmentResponse } from '@prisma/client';

/**
 * Test data factory for creating mock assessment objects
 */
export const createMockAssessment = (overrides?: Partial<Assessment>): Assessment => ({
  id: faker.string.uuid(),
  sessionId: faker.string.uuid(),
  totalScore: faker.number.int({ min: 0, max: 100 }),
  scoreBreakdown: {
    valueAssurance: faker.number.int({ min: 0, max: 100 }),
    customerSafe: faker.number.int({ min: 0, max: 100 }),
    riskCompliance: faker.number.int({ min: 0, max: 100 }),
    governance: faker.number.int({ min: 0, max: 100 }),
  },
  scoreCategory: faker.helpers.arrayElement(['beginner', 'builder', 'leader', 'pioneer']),
  recommendations: [faker.lorem.paragraph(), faker.lorem.paragraph()],
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

/**
 * Test data factory for creating mock assessment session objects
 */
export const createMockAssessmentSession = (
  overrides?: Partial<AssessmentSession>
): AssessmentSession => ({
  id: faker.string.uuid(),
  startedAt: faker.date.recent(),
  lastActiveAt: faker.date.recent(),
  currentStep: faker.number.int({ min: 1, max: 4 }),
  isCompleted: faker.datatype.boolean(),
  responses: {
    value_assurance_1: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
    value_assurance_2: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
    customer_safe_1: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
    customer_safe_2: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
  },
  contactInfo: {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    company: faker.company.name(),
    role: faker.person.jobTitle(),
    phone: faker.phone.number(),
  },
  hubspotContactId: faker.number.int().toString(),
  hubspotDealId: faker.number.int().toString(),
  emailSent: faker.datatype.boolean(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

/**
 * Create mock assessment responses for testing scoring logic
 */
export const createMockResponses = (
  category: 'high' | 'medium' | 'low' = 'medium'
): Record<string, string> => {
  const responseMap = {
    high: 'A', // High-scoring responses
    medium: 'B', // Medium-scoring responses
    low: 'D', // Low-scoring responses
  };

  const response = responseMap[category];

  return {
    // Value Assurance (25% weight)
    value_assurance_1: response,
    value_assurance_2: response,
    value_assurance_3: response,
    value_assurance_4: response,

    // Customer-Safe AI (35% weight - highest priority)
    customer_safe_1: response,
    customer_safe_2: response,
    customer_safe_3: response,
    customer_safe_4: response,
    customer_safe_5: response,

    // Model Risk & Compliance (25% weight)
    risk_compliance_1: response,
    risk_compliance_2: response,
    risk_compliance_3: response,
    risk_compliance_4: response,

    // Implementation Governance (15% weight)
    governance_1: response,
    governance_2: response,
    governance_3: response,
  };
};

/**
 * Create mock contact information for testing
 */
export const createMockContactInfo = (overrides?: any) => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  company: faker.company.name(),
  role: faker.person.jobTitle(),
  phone: faker.phone.number(),
  ...overrides,
});

/**
 * Create mock HubSpot contact response
 */
export const createMockHubSpotContact = (overrides?: any) => ({
  id: faker.number.int().toString(),
  properties: {
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    email: faker.internet.email(),
    company: faker.company.name(),
    jobtitle: faker.person.jobTitle(),
    phone: faker.phone.number(),
    ai_readiness_score: faker.number.int({ min: 0, max: 100 }).toString(),
    ai_readiness_category: faker.helpers.arrayElement(['beginner', 'builder', 'leader', 'pioneer']),
    ...overrides?.properties,
  },
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

/**
 * Create mock HubSpot deal response
 */
export const createMockHubSpotDeal = (overrides?: any) => ({
  id: faker.number.int().toString(),
  properties: {
    dealname: faker.lorem.words(3),
    amount: faker.number.int({ min: 10000, max: 100000 }).toString(),
    dealstage: faker.helpers.arrayElement(['qualification', 'demo', 'proposal', 'negotiation']),
    ai_readiness_score: faker.number.int({ min: 0, max: 100 }).toString(),
    pipeline: 'default',
    ...overrides?.properties,
  },
  associations: {
    contacts: {
      results: [{ id: faker.number.int().toString(), type: 'contact_to_deal' }],
    },
  },
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

/**
 * Wait for a specific amount of time (useful for testing timeouts)
 */
export const waitFor = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a random session ID
 */
export const generateSessionId = (): string => faker.string.uuid();

/**
 * Create mock email template data
 */
export const createMockEmailData = (overrides?: any) => ({
  to: faker.internet.email(),
  subject: faker.lorem.sentence(),
  firstName: faker.person.firstName(),
  company: faker.company.name(),
  score: faker.number.int({ min: 0, max: 100 }),
  category: faker.helpers.arrayElement(['beginner', 'builder', 'leader', 'pioneer']),
  recommendations: [faker.lorem.paragraph(), faker.lorem.paragraph()],
  assessmentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assessment/results/${faker.string.uuid()}`,
  ...overrides,
});

/**
 * Mock API response helper
 */
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: () => Promise.resolve({ data, success: status >= 200 && status < 300 }),
  text: () => Promise.resolve(JSON.stringify({ data, success: status >= 200 && status < 300 })),
});

/**
 * Assert that an object matches the expected structure
 */
export const expectObjectToMatch = (actual: any, expected: any) => {
  Object.keys(expected).forEach((key) => {
    if (expected[key] !== undefined) {
      expect(actual).toHaveProperty(key);
      if (typeof expected[key] === 'object' && expected[key] !== null) {
        expectObjectToMatch(actual[key], expected[key]);
      } else if (expected[key] !== null) {
        expect(actual[key]).toBe(expected[key]);
      }
    }
  });
};

/**
 * Create a complete test scenario with assessment session and responses
 */
export const createTestScenario = (scenario: 'complete' | 'partial' | 'new' = 'complete') => {
  const sessionId = generateSessionId();
  const contactInfo = createMockContactInfo();

  const scenarios = {
    complete: {
      session: createMockAssessmentSession({
        id: sessionId,
        currentStep: 4,
        isCompleted: true,
        responses: createMockResponses('medium'),
        contactInfo,
      }),
      assessment: createMockAssessment({
        sessionId,
        totalScore: 72,
        scoreCategory: 'builder',
      }),
    },
    partial: {
      session: createMockAssessmentSession({
        id: sessionId,
        currentStep: 2,
        isCompleted: false,
        responses: {
          value_assurance_1: 'B',
          value_assurance_2: 'A',
        },
        contactInfo,
      }),
      assessment: null,
    },
    new: {
      session: createMockAssessmentSession({
        id: sessionId,
        currentStep: 1,
        isCompleted: false,
        responses: {},
        contactInfo: null,
      }),
      assessment: null,
    },
  };

  return scenarios[scenario];
};
