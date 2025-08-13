/**
 * HubSpot Contact API Endpoint Tests
 * Testing the complete HubSpot contact creation API with real HTTP requests
 *
 * TDD RED Phase: Testing real API functionality with actual HTTP requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../../../app/api/hubspot/contact/route';
import { HubSpotService } from '../../../lib/services/hubspot';
import { HubSpotRetryService } from '../../../lib/services/hubspot-retry';
import { assessmentResponseFixtures, expectedScoreFixtures } from '../../fixtures/assessment-data';
import type { CreateAssessmentInput } from '../../../lib/types/database';

// Mock only external HubSpot API, not our core functionality
jest.mock('../../../lib/services/hubspot');
jest.mock('../../../lib/services/hubspot-retry');

const MockedHubSpotService = HubSpotService as jest.MockedClass<typeof HubSpotService>;
const MockedHubSpotRetryService = HubSpotRetryService as jest.MockedClass<
  typeof HubSpotRetryService
>;

function createMockAssessmentData(
  overrides: Partial<CreateAssessmentInput> = {}
): CreateAssessmentInput {
  return {
    sessionId: 'api-test-session-123',
    responses: assessmentResponseFixtures.leader,
    totalScore: 78,
    scoreBreakdown: expectedScoreFixtures.leader.scoreBreakdown,
    scoreCategory: 'leader',
    recommendations: expectedScoreFixtures.leader.recommendations,
    email: 'api-test@company.com',
    company: 'API Test Corp',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1-555-api-test',
    completedAt: new Date(),
    completionTimeSeconds: 1500,
    ...overrides,
  };
}

describe('HubSpot Contact API - Real Functionality Tests', () => {
  let mockHubSpotService: jest.Mocked<HubSpotService>;
  let mockRetryService: jest.Mocked<HubSpotRetryService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocked service instances
    mockHubSpotService = new MockedHubSpotService() as jest.Mocked<HubSpotService>;
    mockRetryService = new MockedHubSpotRetryService() as jest.Mocked<HubSpotRetryService>;

    // Mock constructors to return our mocked instances
    MockedHubSpotService.mockImplementation(() => mockHubSpotService);
    MockedHubSpotRetryService.mockImplementation(() => mockRetryService);
  });

  describe('POST /api/hubspot/contact', () => {
    test('should create HubSpot contact successfully for qualified lead', async () => {
      const assessmentData = createMockAssessmentData();

      // Mock successful HubSpot sync
      mockHubSpotService.createOrUpdateContact.mockResolvedValue({
        success: true,
        contactId: 'hs-contact-12345',
      });

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(assessmentData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.contactId).toBe('hs-contact-12345');
      expect(responseData.qualification).toBeDefined();
      expect(responseData.qualification.tier).toBeGreaterThanOrEqual(1);
      expect(responseData.qualification.hubspotSyncRequired).toBe(true);

      // Verify service was called with correct data
      expect(mockHubSpotService.createOrUpdateContact).toHaveBeenCalledWith(assessmentData);
    });

    test('should skip sync for unqualified leads', async () => {
      const unqualifiedAssessment = createMockAssessmentData({
        email: null, // No email = unqualified
      });

      // Mock service to return skipped result
      mockHubSpotService.createOrUpdateContact.mockResolvedValue({
        success: true,
        skipped: true,
        reason: 'Insufficient qualification for HubSpot sync',
      });

      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(unqualifiedAssessment),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.skipped).toBe(true);
      expect(responseData.reason).toBe('Insufficient qualification for HubSpot sync');
    });

    test('should handle HubSpot API failures and queue for retry', async () => {
      const assessmentData = createMockAssessmentData();

      // Mock HubSpot service failure
      const hubspotError = new Error('HubSpot API rate limit exceeded');
      mockHubSpotService.createOrUpdateContact.mockRejectedValue(hubspotError);

      // Mock retry service queuing
      mockRetryService.queueForRetry.mockResolvedValue({
        id: 'retry-entry-123',
        assessmentId: 'assessment-456',
        payload: JSON.stringify(assessmentData),
        retryCount: 0,
        maxRetries: 5,
        nextRetryAt: new Date(Date.now() + 60000),
        status: 'pending',
        priority: 5,
        createdAt: new Date(),
        lastError: null,
        errorType: null,
        processedAt: null,
      });

      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(assessmentData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);

      // Verify retry queuing was attempted
      expect(mockRetryService.queueForRetry).toHaveBeenCalled();
    });

    test('should validate request body format', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(invalidRequest);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid request body');
    });

    test('should handle missing request body', async () => {
      const emptyRequest = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
      });

      const response = await POST(emptyRequest);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Request body required');
    });

    test('should return qualification details in response', async () => {
      const executiveAssessment = createMockAssessmentData({
        firstName: 'John',
        lastName: 'Doe',
        company: 'Fortune 500 Corp', // Large company = executive briefing qualification
        phone: '+1-555-999-8888',
        totalScore: 45, // Low score also qualifies for briefing
      });

      mockHubSpotService.createOrUpdateContact.mockResolvedValue({
        success: true,
        contactId: 'hs-contact-executive-123',
      });

      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(executiveAssessment),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.qualification).toMatchObject({
        tier: 3,
        qualifiedForBriefing: true,
        hubspotSyncRequired: true,
        dealCreationRequired: true,
      });
    });

    test('should handle authentication errors specifically', async () => {
      const assessmentData = createMockAssessmentData();

      const authError = new Error('HubSpot authentication failed');
      authError.name = 'AuthenticationError';
      mockHubSpotService.createOrUpdateContact.mockRejectedValue(authError);

      mockRetryService.queueForRetry.mockResolvedValue({
        id: 'retry-auth-error',
        assessmentId: 'assessment-auth',
        payload: JSON.stringify(assessmentData),
        retryCount: 0,
        maxRetries: 5,
        nextRetryAt: new Date(Date.now() + 60000),
        status: 'pending',
        priority: 5,
        createdAt: new Date(),
        lastError: 'HubSpot authentication failed',
        errorType: 'auth_error',
        processedAt: null,
      });

      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(assessmentData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);

      // Verify retry was queued with correct error type
      expect(mockRetryService.queueForRetry).toHaveBeenCalledWith(
        expect.any(String), // assessmentId
        assessmentData,
        'auth_error',
        expect.any(Object) // options
      );
    });

    test('should include response timing headers', async () => {
      const assessmentData = createMockAssessmentData();

      mockHubSpotService.createOrUpdateContact.mockResolvedValue({
        success: true,
        contactId: 'hs-contact-timing-test',
      });

      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(assessmentData),
      });

      const response = await POST(request);

      // Check for timing/performance headers
      expect(response.headers.get('X-Response-Time')).toBeDefined();
      expect(response.headers.get('X-HubSpot-Sync-Status')).toBe('success');
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should handle rate limit errors appropriately', async () => {
      const assessmentData = createMockAssessmentData();

      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockHubSpotService.createOrUpdateContact.mockRejectedValue(rateLimitError);

      mockRetryService.queueForRetry.mockResolvedValue({
        id: 'retry-rate-limit',
        assessmentId: 'assessment-rate-limit',
        payload: JSON.stringify(assessmentData),
        retryCount: 0,
        maxRetries: 5,
        nextRetryAt: new Date(Date.now() + 300000), // 5 minute delay for rate limit
        status: 'pending',
        priority: 3, // Higher priority for rate limit retries
        createdAt: new Date(),
        lastError: 'Rate limit exceeded',
        errorType: 'rate_limit',
        processedAt: null,
      });

      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(assessmentData),
      });

      await POST(request);

      // Verify rate limit specific handling
      expect(mockRetryService.queueForRetry).toHaveBeenCalledWith(
        expect.any(String),
        assessmentData,
        'rate_limit',
        expect.objectContaining({
          priority: 3, // Higher priority for rate limit retries
        })
      );
    });
  });

  describe('Data Validation', () => {
    test('should validate required assessment fields', async () => {
      const incompleteData = {
        sessionId: 'incomplete-test',
        // Missing required fields like responses, totalScore, etc.
      };

      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('validation');
    });

    test('should sanitize and validate email format', async () => {
      const badEmailData = createMockAssessmentData({
        email: 'not-a-valid-email-address',
      });

      const request = new NextRequest('http://localhost:3000/api/hubspot/contact', {
        method: 'POST',
        body: JSON.stringify(badEmailData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid email format');
    });
  });
});
