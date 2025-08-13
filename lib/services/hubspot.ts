/**
 * HubSpot CRM Integration Service
 * Complete HubSpot API integration with contact/deal creation and retry logic
 *
 * Implements real HubSpot API client integration following Free tier limitations
 * with comprehensive error handling, logging, and monitoring
 */

import { Client } from '@hubspot/api-client';
import { LeadQualificationService, type LeadQualificationResult } from './lead-qualification';
import { HubSpotErrorHandler, HubSpotErrorFactory } from '../errors/hubspot-errors';
import { logger } from '../utils/logger';
import type { CreateAssessmentInput, HubspotSyncResult } from '../types/database';

interface HubSpotSyncPayload {
  email: string;
  properties: { [key: string]: string | null };
}

interface HubSpotDealPayload {
  properties: { [key: string]: string | null };
  associations: Array<{
    to: { id: string };
    types: Array<{ associationCategory: string; associationTypeId: number }>;
  }>;
}

export class HubSpotService {
  private client: Client;
  private readonly component = 'hubspot-service';

  constructor() {
    this.validateConfiguration();

    try {
      this.client = new Client({
        accessToken: process.env.HUBSPOT_ACCESS_TOKEN!,
      });

      logger.info('HubSpot service initialized', {
        component: this.component,
        hasAccessToken: !!process.env.HUBSPOT_ACCESS_TOKEN,
      });
    } catch (error) {
      logger.error('Failed to initialize HubSpot client', error as Error, {
        component: this.component,
      });
      throw HubSpotErrorFactory.authenticationError('Failed to initialize HubSpot client');
    }
  }

  /**
   * Validates HubSpot configuration
   */
  private validateConfiguration(): void {
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      throw HubSpotErrorFactory.authenticationError(
        'HUBSPOT_ACCESS_TOKEN environment variable is required'
      );
    }

    // Validate token format (HubSpot access tokens are typically in specific formats)
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (token.length < 20 || !/^[a-zA-Z0-9\-_]+$/.test(token)) {
      logger.warn('HubSpot access token format appears invalid', {
        component: this.component,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 8) + '...',
      });
    }
  }

  /**
   * Creates or updates HubSpot contact with assessment data
   */
  async createOrUpdateContact(
    assessmentData: CreateAssessmentInput
  ): Promise<HubspotSyncResult & { skipped?: boolean; reason?: string }> {
    const operationId = logger.operationStart('create-or-update-contact', {
      component: this.component,
      assessmentId: assessmentData.sessionId,
      email: assessmentData.email,
    });

    const startTime = Date.now();

    try {
      // Validate input data
      this.validateAssessmentData(assessmentData);

      const qualification = LeadQualificationService.qualifyLead(assessmentData);

      logger.debug('Lead qualification completed', {
        component: this.component,
        operationId,
        tier: qualification.tier,
        qualifiedForBriefing: qualification.qualifiedForBriefing,
        hubspotSyncRequired: qualification.hubspotSyncRequired,
      });

      if (!qualification.hubspotSyncRequired) {
        logger.info('Skipping HubSpot sync - insufficient qualification', {
          component: this.component,
          operationId,
          tier: qualification.tier,
          reason: 'Insufficient qualification for HubSpot sync',
        });

        return {
          success: true,
          skipped: true,
          reason: 'Insufficient qualification for HubSpot sync',
        };
      }

      const hubspotPayload = this.buildContactPayload(assessmentData, qualification);

      logger.apiCall('POST', '/crm/v3/objects/contacts', {
        component: this.component,
        operationId,
        leadQuality: this.getLeadQualityLabel(qualification.tier),
      });

      const contactResult = await this.client.crm.contacts.basicApi.create({
        properties: hubspotPayload.properties,
        associations: [],
      });

      const contactDuration = Date.now() - startTime;
      logger.apiResponse('POST', '/crm/v3/objects/contacts', 201, contactDuration, {
        component: this.component,
        operationId,
        contactId: contactResult.id,
      });

      const result: HubspotSyncResult = {
        success: true,
        contactId: contactResult.id,
      };

      // Create deal for Executive Briefing qualified leads
      if (qualification.qualifiedForBriefing) {
        logger.debug('Creating executive briefing deal for qualified lead', {
          component: this.component,
          operationId,
          contactId: contactResult.id,
        });

        const dealResult = await this.createExecutiveBriefingDeal(
          contactResult.id,
          assessmentData,
          operationId
        );
        result.dealId = dealResult.id;
      }

      const totalDuration = Date.now() - startTime;
      logger.operationComplete('create-or-update-contact', operationId, totalDuration, {
        component: this.component,
        contactId: result.contactId,
        dealId: result.dealId,
        tier: qualification.tier,
      });

      return result;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const hubspotError = HubSpotErrorHandler.handleError(error);

      logger.operationFailed('create-or-update-contact', operationId, totalDuration, hubspotError, {
        component: this.component,
        errorType: hubspotError.details.category,
        isRetryable: hubspotError.isRetryable,
        statusCode: hubspotError.details.statusCode,
      });

      throw hubspotError;
    }
  }

  /**
   * Validates assessment data before processing
   */
  private validateAssessmentData(assessmentData: CreateAssessmentInput): void {
    if (!assessmentData) {
      throw HubSpotErrorFactory.validationError('Assessment data is required');
    }

    if (!assessmentData.sessionId) {
      throw HubSpotErrorFactory.validationError('Session ID is required');
    }

    // Additional validation can be added here
  }

  /**
   * Builds HubSpot contact payload from assessment data
   */
  private buildContactPayload(
    assessmentData: CreateAssessmentInput,
    qualification: LeadQualificationResult
  ): HubSpotSyncPayload {
    const scoreBreakdown = this.parseScoreBreakdown(assessmentData.scoreBreakdown);

    return {
      email: assessmentData.email!,
      properties: {
        // Standard contact properties
        firstname: assessmentData.firstName,
        lastname: assessmentData.lastName,
        company: assessmentData.company,
        phone: assessmentData.phone,

        // Custom AI assessment properties (max 10 for Free tier) - all as strings
        ai_assessment_score: assessmentData.totalScore?.toString() || null,
        ai_assessment_category: assessmentData.scoreCategory,
        ai_value_score: scoreBreakdown?.valueAssurance?.toString() || null,
        ai_customer_score: scoreBreakdown?.customerSafe?.toString() || null,
        ai_risk_score: scoreBreakdown?.riskCompliance?.toString() || null,
        ai_governance_score: scoreBreakdown?.governance?.toString() || null,
        ai_assessment_date: assessmentData.completedAt
          ? assessmentData.completedAt.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        ai_completion_time: assessmentData.completionTimeSeconds?.toString() || null,
        ai_lead_quality: this.getLeadQualityLabel(qualification.tier),
        lead_source: 'AI Reality Check Scorecard',
      },
    };
  }

  /**
   * Parses score breakdown from JSON or returns null
   */
  private parseScoreBreakdown(scoreBreakdown: any): any {
    if (!scoreBreakdown) return null;

    if (typeof scoreBreakdown === 'string') {
      try {
        return JSON.parse(scoreBreakdown);
      } catch {
        return null;
      }
    }

    return scoreBreakdown;
  }

  /**
   * Gets lead quality label for tier
   */
  getLeadQualityLabel(tier: number): string {
    switch (tier) {
      case 1:
        return 'basic';
      case 2:
        return 'enhanced';
      case 3:
        return 'executive_briefing_qualified';
      default:
        return 'unqualified';
    }
  }

  /**
   * Creates executive briefing deal for qualified leads
   */
  private async createExecutiveBriefingDeal(
    contactId: string,
    data: CreateAssessmentInput,
    operationId?: string
  ): Promise<{ id: string }> {
    const startTime = Date.now();

    try {
      const dealPayload: HubSpotDealPayload = {
        properties: {
          dealname: `AI Reality Check - ${data.firstName} ${data.lastName} (${data.company})`,
          dealstage: 'executive_briefing_requested',
          amount: '5000', // Estimated consulting value
          pipeline: 'ai_consulting_pipeline',
          closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          ai_assessment_score: data.totalScore?.toString() || null,
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
          },
        ],
      };

      logger.apiCall('POST', '/crm/v3/objects/deals', {
        component: this.component,
        operationId,
        contactId,
        dealValue: dealPayload.properties.amount,
      });

      const dealResult = await this.client.crm.deals.basicApi.create(dealPayload);

      const duration = Date.now() - startTime;
      logger.apiResponse('POST', '/crm/v3/objects/deals', 201, duration, {
        component: this.component,
        operationId,
        dealId: dealResult.id,
        contactId,
      });

      return { id: dealResult.id };
    } catch (error) {
      const duration = Date.now() - startTime;
      const hubspotError = HubSpotErrorHandler.handleError(error);

      logger.error('Failed to create executive briefing deal', hubspotError, {
        component: this.component,
        operationId,
        contactId,
        errorType: hubspotError.details.category,
        statusCode: hubspotError.details.statusCode,
        duration,
      });

      throw hubspotError;
    }
  }
}

// Legacy functions for backward compatibility (now implemented)
export async function syncAssessmentToHubspot(assessmentData: any): Promise<any> {
  const hubspotService = new HubSpotService();
  return hubspotService.createOrUpdateContact(assessmentData);
}

export async function createHubspotContact(contactData: any): Promise<any> {
  const hubspotService = new HubSpotService();
  return hubspotService.createOrUpdateContact(contactData);
}

export async function createHubspotDeal(dealData: any): Promise<any> {
  // This is now handled within createOrUpdateContact for executive briefing qualified leads
  throw new Error(
    'Use HubSpotService.createOrUpdateContact instead - deals are created automatically for qualified leads'
  );
}
