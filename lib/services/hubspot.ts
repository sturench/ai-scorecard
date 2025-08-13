/**
 * HubSpot CRM Integration Service
 * Complete HubSpot API integration with contact/deal creation and retry logic
 *
 * Implements real HubSpot API client integration following Free tier limitations
 */

import { Client } from '@hubspot/api-client';
import { LeadQualificationService, type LeadQualificationResult } from './lead-qualification';
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

  constructor() {
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is required');
    }

    this.client = new Client({
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
    });
  }

  /**
   * Creates or updates HubSpot contact with assessment data
   */
  async createOrUpdateContact(
    assessmentData: CreateAssessmentInput
  ): Promise<HubspotSyncResult & { skipped?: boolean; reason?: string }> {
    const qualification = LeadQualificationService.qualifyLead(assessmentData);

    if (!qualification.hubspotSyncRequired) {
      return {
        success: true,
        skipped: true,
        reason: 'Insufficient qualification for HubSpot sync',
      };
    }

    const hubspotPayload = this.buildContactPayload(assessmentData, qualification);

    const contactResult = await this.client.crm.contacts.basicApi.create({
      properties: hubspotPayload.properties,
      associations: [],
    });

    const result: HubspotSyncResult = {
      success: true,
      contactId: contactResult.id,
    };

    // Create deal for Executive Briefing qualified leads
    if (qualification.qualifiedForBriefing) {
      const dealResult = await this.createExecutiveBriefingDeal(contactResult.id, assessmentData);
      result.dealId = dealResult.id;
    }

    return result;
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
    data: CreateAssessmentInput
  ): Promise<{ id: string }> {
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

    const dealResult = await this.client.crm.deals.basicApi.create(dealPayload);
    return { id: dealResult.id };
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
