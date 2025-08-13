/**
 * Lead Qualification Service Tests
 * Testing the complete Tier 1-3 lead qualification engine for HubSpot integration
 *
 * TDD RED Phase: Writing failing tests for real functionality
 */

import { LeadQualificationService } from '../../lib/services/lead-qualification';
import { assessmentResponseFixtures, expectedScoreFixtures } from '../fixtures/assessment-data';
import type { CreateAssessmentInput, ScoreCalculation } from '../../lib/types/database';

// Create realistic assessment data for testing
function createMockAssessmentData(
  overrides: Partial<CreateAssessmentInput> = {}
): CreateAssessmentInput {
  return {
    sessionId: 'test-session-123',
    responses: assessmentResponseFixtures.builder,
    totalScore: 70, // Good score that doesn't trigger briefing by default
    scoreBreakdown: expectedScoreFixtures.builder.scoreBreakdown,
    scoreCategory: 'builder',
    recommendations: expectedScoreFixtures.builder.recommendations,
    email: 'test@company.com',
    company: 'Test Corporation',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-123-4567',
    jobTitle: 'CTO',
    companySize: 'medium',
    industry: 'technology',
    completedAt: new Date(),
    completionTimeSeconds: 1200,
    ...overrides,
  };
}

describe('Lead Qualification Service - Real Functionality Tests', () => {
  describe('Tier 1 Qualification (Basic)', () => {
    test('should qualify as Tier 1 with email only', () => {
      const assessment = createMockAssessmentData({
        email: 'basic@company.com',
        firstName: null,
        lastName: null,
        company: null,
        phone: null,
        totalScore: 75, // Good score to avoid briefing qualification
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(1);
      expect(result.hubspotSyncRequired).toBe(true);
      expect(result.qualifiedForBriefing).toBe(false);
      expect(result.dealCreationRequired).toBe(false);
    });

    test('should not qualify with no email', () => {
      const assessment = createMockAssessmentData({
        email: null,
        firstName: 'John',
        company: 'Regular Business', // Non-large company name (no Corp, Inc, etc.)
        totalScore: 75, // Good score to avoid briefing qualification
        phone: null, // Remove phone to avoid complete contact qualification
        lastName: null, // Remove lastname to avoid complete contact qualification
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(0);
      expect(result.hubspotSyncRequired).toBe(false);
      expect(result.qualifiedForBriefing).toBe(false);
    });
  });

  describe('Tier 2 Qualification (Enhanced)', () => {
    test('should qualify as Tier 2 with email, name, and company', () => {
      const assessment = createMockAssessmentData({
        email: 'enhanced@company.com',
        firstName: 'Jane',
        company: 'Simple Business', // Non-large company name
        lastName: null, // Missing last name
        phone: null,
        totalScore: 75, // Good score to avoid briefing qualification
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(2);
      expect(result.hubspotSyncRequired).toBe(true);
      expect(result.qualifiedForBriefing).toBe(false);
      expect(result.dealCreationRequired).toBe(false);
    });

    test('should stay Tier 1 without company even with firstName', () => {
      const assessment = createMockAssessmentData({
        email: 'partial@company.com',
        firstName: 'John',
        company: null, // Missing company
        totalScore: 75, // Good score to avoid briefing qualification
        phone: null, // Remove phone to avoid complete contact qualification
        lastName: null, // Remove lastname to avoid complete contact qualification
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(1);
      expect(result.hubspotSyncRequired).toBe(true);
      expect(result.qualifiedForBriefing).toBe(false);
    });
  });

  describe('Tier 3 Qualification (Executive Briefing)', () => {
    test('should qualify for executive briefing with complete contact info', () => {
      const assessment = createMockAssessmentData({
        email: 'complete@company.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        company: 'Complete Corp',
        phone: '+1-555-999-8888',
        totalScore: 75, // Good score but complete contact triggers briefing
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(3);
      expect(result.qualifiedForBriefing).toBe(true);
      expect(result.dealCreationRequired).toBe(true);
      expect(result.hubspotSyncRequired).toBe(true);
    });

    test('should qualify for briefing with low score (needs help)', () => {
      const assessment = createMockAssessmentData({
        email: 'help@company.com',
        firstName: 'Mike',
        company: 'Struggling Corp',
        totalScore: 45, // Risk zone - needs help
        scoreCategory: 'beginner',
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(3);
      expect(result.qualifiedForBriefing).toBe(true);
      expect(result.dealCreationRequired).toBe(true);
    });

    test('should qualify high-value company with large company indicators', () => {
      const assessment = createMockAssessmentData({
        email: 'ceo@fortune500corp.com',
        firstName: 'David',
        company: 'Fortune 500 Corporation', // Large company keyword
        totalScore: 65,
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(3);
      expect(result.qualifiedForBriefing).toBe(true);
      expect(result.dealCreationRequired).toBe(true);
    });

    test('should qualify company with critical customer safety issues', () => {
      const assessment = createMockAssessmentData({
        email: 'security@techcompany.com',
        company: 'Tech Security Inc',
        scoreBreakdown: {
          valueAssurance: 70,
          customerSafe: 35, // Critical customer safety issue
          riskCompliance: 60,
          governance: 55,
        },
        totalScore: 55,
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(3);
      expect(result.qualifiedForBriefing).toBe(true);
      expect(result.dealCreationRequired).toBe(true);
    });

    test('should qualify high-value industry company', () => {
      const assessment = createMockAssessmentData({
        email: 'director@financialgroup.com',
        company: 'Global Finance Solutions', // Finance industry
        firstName: 'Lisa',
        totalScore: 70,
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(3);
      expect(result.qualifiedForBriefing).toBe(true);
    });
  });

  describe('Company Value Indicators', () => {
    test('should recognize large company keywords', () => {
      const largeCompanyNames = [
        'Acme Corp',
        'Tech Corporation',
        'Global Inc',
        'Business LLC',
        'Enterprise Ltd',
        'Solutions Group',
        'Investment Holdings',
      ];

      largeCompanyNames.forEach((companyName) => {
        const assessment = createMockAssessmentData({
          email: 'exec@company.com',
          company: companyName,
          totalScore: 65,
        });

        const result = LeadQualificationService.qualifyLead(assessment);

        expect(result.qualifiedForBriefing).toBe(true);
        expect(result.tier).toBe(3);
      });
    });

    test('should not qualify small company without other indicators', () => {
      const assessment = createMockAssessmentData({
        email: 'owner@smallbiz.com',
        company: 'Small Business', // No large company indicators
        totalScore: 75, // Good score but no other qualifiers
        scoreBreakdown: {
          valueAssurance: 75,
          customerSafe: 80, // No critical issues
          riskCompliance: 70,
          governance: 75,
        },
        firstName: 'Owner',
        lastName: null, // Missing lastName to prevent complete contact qualification
        phone: null, // Missing phone to prevent complete contact qualification
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(2); // Enhanced tier, not executive briefing
      expect(result.qualifiedForBriefing).toBe(false);
    });
  });

  describe('Industry-Based Qualification', () => {
    test('should qualify high-value industries', () => {
      const highValueIndustries = [
        'finance',
        'banking',
        'healthcare',
        'technology',
        'manufacturing',
      ];

      highValueIndustries.forEach((industry) => {
        const assessment = createMockAssessmentData({
          email: `exec@${industry}company.com`,
          company: `${industry} Solutions`,
          totalScore: 65,
        });

        const result = LeadQualificationService.qualifyLead(assessment);

        expect(result.qualifiedForBriefing).toBe(true);
        expect(result.tier).toBe(3);
      });
    });
  });

  describe('Score Threshold Testing', () => {
    test('should qualify at exactly score 60 threshold', () => {
      const assessment = createMockAssessmentData({
        totalScore: 60, // At threshold
        email: 'threshold@company.com',
        firstName: 'Threshold',
        lastName: null, // Missing lastName to prevent complete contact qualification
        company: 'Regular Company', // No large company indicators
        phone: null, // Missing phone to prevent complete contact qualification
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      // Score 60 should NOT trigger briefing (needs to be < 60)
      expect(result.qualifiedForBriefing).toBe(false);
    });

    test('should qualify just below score 60 threshold', () => {
      const assessment = createMockAssessmentData({
        totalScore: 59, // Just below threshold
        email: 'below@company.com',
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.qualifiedForBriefing).toBe(true);
      expect(result.tier).toBe(3);
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should handle null/undefined assessment data gracefully', () => {
      expect(() => {
        LeadQualificationService.qualifyLead(null as any);
      }).toThrow('Invalid assessment data');
    });

    test('should handle missing scoreBreakdown', () => {
      const assessment = createMockAssessmentData({
        scoreBreakdown: null,
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      // Should still work without scoreBreakdown
      expect(result.tier).toBeGreaterThanOrEqual(0);
      expect(result.tier).toBeLessThanOrEqual(3);
    });

    test('should handle empty email string', () => {
      const assessment = createMockAssessmentData({
        email: '', // Empty string
        firstName: 'John',
        company: 'Test Corp',
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(0);
      expect(result.hubspotSyncRequired).toBe(false);
    });

    test('should handle whitespace-only company name', () => {
      const assessment = createMockAssessmentData({
        email: 'test@company.com',
        firstName: 'John',
        company: '   ', // Whitespace only
      });

      const result = LeadQualificationService.qualifyLead(assessment);

      expect(result.tier).toBe(1); // Should fall back to Tier 1
    });
  });

  describe('Lead Qualification Result Interface', () => {
    test('should return properly structured qualification result', () => {
      const assessment = createMockAssessmentData();

      const result = LeadQualificationService.qualifyLead(assessment);

      // Validate result structure
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('qualifiedForBriefing');
      expect(result).toHaveProperty('hubspotSyncRequired');
      expect(result).toHaveProperty('dealCreationRequired');

      expect(typeof result.tier).toBe('number');
      expect(typeof result.qualifiedForBriefing).toBe('boolean');
      expect(typeof result.hubspotSyncRequired).toBe('boolean');
      expect(typeof result.dealCreationRequired).toBe('boolean');
    });
  });
});
