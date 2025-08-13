/**
 * HubSpot Integration Service Tests
 * Testing the complete HubSpot API integration with contact/deal creation and retry logic
 *
 * TDD RED Phase: Testing real functionality with mocked HubSpot API calls
 */

import { HubSpotService } from '../../lib/services/hubspot';
import { LeadQualificationService } from '../../lib/services/lead-qualification';
import { HubSpotRetryService } from '../../lib/services/hubspot-retry';
import { assessmentResponseFixtures, expectedScoreFixtures } from '../fixtures/assessment-data';
import type { CreateAssessmentInput, HubspotSyncResult } from '../../lib/types/database';
import { Client } from '@hubspot/api-client';

// Mock only the HubSpot API client, not our core functionality
jest.mock('@hubspot/api-client');
const MockedClient = Client as jest.MockedClass<typeof Client>;

// Create realistic assessment data for testing
function createMockAssessmentData(
  overrides: Partial<CreateAssessmentInput> = {}
): CreateAssessmentInput {
  return {
    sessionId: 'test-session-123',
    responses: assessmentResponseFixtures.leader,
    totalScore: 78,
    scoreBreakdown: expectedScoreFixtures.leader.scoreBreakdown,
    scoreCategory: 'leader',
    recommendations: expectedScoreFixtures.leader.recommendations,
    email: 'executive@company.com',
    company: 'Innovation Industries',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1-555-456-7890',
    jobTitle: 'CEO',
    companySize: 'large',
    industry: 'technology',
    completedAt: new Date('2024-01-15T11:00:00Z'),
    completionTimeSeconds: 1800,
    ...overrides,
  };
}

describe('HubSpot Integration Service - Real Functionality Tests', () => {
  let hubspotService: HubSpotService;
  let mockHubSpotClient: jest.Mocked<Client>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock HubSpot client
    mockHubSpotClient = new MockedClient() as jest.Mocked<Client>;

    // Mock the API endpoints we'll use
    mockHubSpotClient.crm = {
      contacts: {
        basicApi: {
          create: jest.fn(),
          getById: jest.fn(),
          update: jest.fn(),
        },
      },
      deals: {
        basicApi: {
          create: jest.fn(),
          getById: jest.fn(),
          update: jest.fn(),
        },
      },
    } as any;

    hubspotService = new HubSpotService();

    // Inject the mocked client
    (hubspotService as any).client = mockHubSpotClient;
  });

  describe('Contact Creation', () => {
    test('should create HubSpot contact with proper payload structure', async () => {
      const assessment = createMockAssessmentData();

      // Mock successful contact creation
      mockHubSpotClient.crm.contacts.basicApi.create.mockResolvedValue({
        id: '12345',
        properties: {
          email: assessment.email,
          firstname: assessment.firstName,
          lastname: assessment.lastName,
        },
      } as any);

      // Mock deal creation for executive briefing qualified leads
      mockHubSpotClient.crm.deals.basicApi.create.mockResolvedValue({
        id: '67890',
        properties: {
          dealname: 'Test Deal',
        },
      } as any);

      const result = await hubspotService.createOrUpdateContact(assessment);

      expect(result.success).toBe(true);
      expect(result.contactId).toBe('12345');

      // Verify the contact creation was called with proper payload
      expect(mockHubSpotClient.crm.contacts.basicApi.create).toHaveBeenCalledWith({
        properties: expect.objectContaining({
          firstname: 'Jane',
          lastname: 'Smith',
          company: 'Innovation Industries',
          phone: '+1-555-456-7890',
          ai_assessment_score: '78',
          ai_assessment_category: 'leader',
          ai_value_score: '80',
          ai_customer_score: '82',
          ai_risk_score: '75',
          ai_governance_score: '73',
          ai_assessment_date: '2024-01-15',
          ai_completion_time: '1800',
          ai_lead_quality: 'executive_briefing_qualified', // Complete contact info = Tier 3
          lead_source: 'AI Reality Check Scorecard',
        }),
        associations: [],
      });
    });

    test('should handle Tier 1 qualification with basic lead quality', async () => {
      const tier1Assessment = createMockAssessmentData({
        firstName: null,
        lastName: null,
        company: null,
        phone: null,
        totalScore: 65,
      });

      mockHubSpotClient.crm.contacts.basicApi.create.mockResolvedValue({
        id: '54321',
        properties: { email: tier1Assessment.email },
      } as any);

      const result = await hubspotService.createOrUpdateContact(tier1Assessment);

      expect(result.success).toBe(true);

      // Should classify as basic lead quality
      expect(mockHubSpotClient.crm.contacts.basicApi.create).toHaveBeenCalledWith({
        properties: expect.objectContaining({
          ai_lead_quality: 'basic',
        }),
        associations: [],
      });
    });

    test('should skip sync for unqualified leads', async () => {
      const unqualifiedAssessment = createMockAssessmentData({
        email: null, // No email = no qualification
      });

      const result = await hubspotService.createOrUpdateContact(unqualifiedAssessment);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('Insufficient qualification for HubSpot sync');
      expect(mockHubSpotClient.crm.contacts.basicApi.create).not.toHaveBeenCalled();
    });
  });

  describe('Executive Briefing Deal Creation', () => {
    test('should create deal for executive briefing qualified leads', async () => {
      const executiveAssessment = createMockAssessmentData({
        totalScore: 45, // Low score triggers executive briefing
        firstName: 'John',
        lastName: 'Doe',
        company: 'Struggling Corp',
        phone: '+1-555-123-4567',
      });

      // Mock contact creation
      mockHubSpotClient.crm.contacts.basicApi.create.mockResolvedValue({
        id: '11111',
        properties: { email: executiveAssessment.email },
      } as any);

      // Mock deal creation
      mockHubSpotClient.crm.deals.basicApi.create.mockResolvedValue({
        id: '22222',
        properties: {
          dealname: 'AI Reality Check - John Doe (Struggling Corp)',
          dealstage: 'executive_briefing_requested',
        },
      } as any);

      const result = await hubspotService.createOrUpdateContact(executiveAssessment);

      expect(result.success).toBe(true);
      expect(result.contactId).toBe('11111');

      // Verify deal was created
      expect(mockHubSpotClient.crm.deals.basicApi.create).toHaveBeenCalledWith({
        properties: expect.objectContaining({
          dealname: 'AI Reality Check - John Doe (Struggling Corp)',
          dealstage: 'executive_briefing_requested',
          amount: '5000',
          pipeline: 'ai_consulting_pipeline',
          closedate: expect.any(String),
          ai_assessment_score: '45',
        }),
        associations: [
          {
            to: { id: '11111' },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
          },
        ],
      });
    });

    test('should not create deal for non-qualified leads', async () => {
      const nonQualifiedAssessment = createMockAssessmentData({
        totalScore: 75, // Good score
        firstName: 'Jane',
        company: 'Simple Business', // No large company indicators
        lastName: null, // Missing last name to prevent complete contact qualification
        phone: null, // Missing phone to prevent complete contact qualification
        scoreBreakdown: {
          valueAssurance: 75,
          customerSafe: 80, // No critical issues
          riskCompliance: 70,
          governance: 75,
        },
      });

      mockHubSpotClient.crm.contacts.basicApi.create.mockResolvedValue({
        id: '33333',
        properties: { email: nonQualifiedAssessment.email },
      } as any);

      const result = await hubspotService.createOrUpdateContact(nonQualifiedAssessment);

      expect(result.success).toBe(true);
      expect(result.contactId).toBe('33333');

      // Should NOT create a deal
      expect(mockHubSpotClient.crm.deals.basicApi.create).not.toHaveBeenCalled();
    });
  });

  describe('Lead Quality Classification', () => {
    test('should classify lead quality correctly for each tier', () => {
      const testCases = [
        { tier: 1, expected: 'basic' },
        { tier: 2, expected: 'enhanced' },
        { tier: 3, expected: 'executive_briefing_qualified' },
        { tier: 0, expected: 'unqualified' },
      ];

      testCases.forEach(({ tier, expected }) => {
        const result = hubspotService.getLeadQualityLabel(tier);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle HubSpot API contact creation failure', async () => {
      const assessment = createMockAssessmentData();

      // Mock API failure
      const hubspotError = new Error('HubSpot API rate limit exceeded');
      mockHubSpotClient.crm.contacts.basicApi.create.mockRejectedValue(hubspotError);

      await expect(hubspotService.createOrUpdateContact(assessment)).rejects.toThrow(
        'HubSpot API rate limit exceeded'
      );
    });

    test('should handle deal creation failure after successful contact creation', async () => {
      const executiveAssessment = createMockAssessmentData({
        totalScore: 40, // Qualifies for briefing
        firstName: 'John',
        lastName: 'Doe',
        company: 'Test Corp',
        phone: '+1-555-999-8888',
      });

      // Mock successful contact creation
      mockHubSpotClient.crm.contacts.basicApi.create.mockResolvedValue({
        id: '44444',
        properties: { email: executiveAssessment.email },
      } as any);

      // Mock deal creation failure
      const dealError = new Error('Deal creation failed');
      mockHubSpotClient.crm.deals.basicApi.create.mockRejectedValue(dealError);

      await expect(hubspotService.createOrUpdateContact(executiveAssessment)).rejects.toThrow(
        'Deal creation failed'
      );
    });
  });

  describe('Payload Validation', () => {
    test('should handle missing optional fields gracefully', async () => {
      const minimalAssessment = createMockAssessmentData({
        lastName: null,
        phone: null,
        jobTitle: null,
        companySize: null,
        industry: null,
      });

      mockHubSpotClient.crm.contacts.basicApi.create.mockResolvedValue({
        id: '55555',
        properties: { email: minimalAssessment.email },
      } as any);

      const result = await hubspotService.createOrUpdateContact(minimalAssessment);

      expect(result.success).toBe(true);

      // Should still include available fields and handle nulls
      expect(mockHubSpotClient.crm.contacts.basicApi.create).toHaveBeenCalledWith({
        properties: expect.objectContaining({
          firstname: minimalAssessment.firstName,
          lastname: null,
          phone: null,
        }),
        associations: [],
      });
    });

    test('should format date fields correctly', async () => {
      const assessment = createMockAssessmentData({
        completedAt: new Date('2024-02-15T14:30:00Z'),
        company: 'Simple Business', // Non-large company name
        lastName: null, // Missing last name to prevent complete contact qualification
        phone: null, // Missing phone to prevent complete contact qualification
        totalScore: 75, // Good score to avoid briefing qualification
      });

      mockHubSpotClient.crm.contacts.basicApi.create.mockResolvedValue({
        id: '66666',
        properties: { email: assessment.email },
      } as any);

      await hubspotService.createOrUpdateContact(assessment);

      expect(mockHubSpotClient.crm.contacts.basicApi.create).toHaveBeenCalledWith({
        properties: expect.objectContaining({
          ai_assessment_date: '2024-02-15',
        }),
        associations: [],
      });
    });
  });

  describe('Integration with Lead Qualification Service', () => {
    test('should use real qualification logic, not mocked results', async () => {
      // Create assessment data that we know qualifies for executive briefing
      const realAssessmentData = createMockAssessmentData({
        email: 'ceo@bigcorporation.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        company: 'Big Corporation', // Large company indicator
        phone: '+1-555-111-2222',
        totalScore: 75,
      });

      mockHubSpotClient.crm.contacts.basicApi.create.mockResolvedValue({
        id: '77777',
        properties: { email: realAssessmentData.email },
      } as any);

      mockHubSpotClient.crm.deals.basicApi.create.mockResolvedValue({
        id: '88888',
        properties: { dealname: 'Test Deal' },
      } as any);

      const result = await hubspotService.createOrUpdateContact(realAssessmentData);

      // Verify that real qualification logic was used
      expect(result.success).toBe(true);
      expect(mockHubSpotClient.crm.deals.basicApi.create).toHaveBeenCalled(); // Should create deal

      // The qualification logic should have determined this qualifies for briefing
      const qualification = LeadQualificationService.qualifyLead(realAssessmentData);
      expect(qualification.qualifiedForBriefing).toBe(true);
      expect(qualification.tier).toBe(3);
    });
  });
});
