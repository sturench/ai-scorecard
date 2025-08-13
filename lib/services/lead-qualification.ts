/**
 * Lead Qualification Service
 * Complete Tier 1-3 lead qualification engine for HubSpot CRM integration
 *
 * Implements executive briefing qualification logic with real business rules
 */

import type { CreateAssessmentInput } from '../types/database';

export interface LeadQualificationResult {
  tier: number;
  qualifiedForBriefing: boolean;
  hubspotSyncRequired: boolean;
  dealCreationRequired: boolean;
}

export class LeadQualificationService {
  /**
   * Main lead qualification method - determines tier and briefing eligibility
   */
  static qualifyLead(assessmentData: CreateAssessmentInput): LeadQualificationResult {
    if (!assessmentData) {
      throw new Error('Invalid assessment data');
    }

    const tier = this.determineTier(assessmentData);
    const qualifiedForBriefing = this.isExecutiveBriefingQualified(assessmentData);

    return {
      tier,
      qualifiedForBriefing,
      hubspotSyncRequired: tier >= 1, // All tiers sync to HubSpot
      dealCreationRequired: qualifiedForBriefing,
    };
  }

  /**
   * Determines the lead tier based on available contact information
   * Tier 0: No qualification (no email)
   * Tier 1: Basic (email only)
   * Tier 2: Enhanced (email + name + company)
   * Tier 3: Executive Briefing Qualified
   */
  private static determineTier(data: CreateAssessmentInput): number {
    // Tier 1 (Basic): Email provided → HubSpot contact creation
    if (data.email && data.email.trim()) {
      // Tier 2 (Enhanced): Name + Company → Enhanced contact record
      if (data.firstName && data.firstName.trim() && data.company && data.company.trim()) {
        // Tier 3 (Executive Briefing Qualified): Complete contact OR qualifying criteria
        if (this.isExecutiveBriefingQualified(data)) {
          return 3;
        }
        return 2;
      }
      return 1;
    }
    return 0; // No qualification
  }

  /**
   * Determines if lead qualifies for executive briefing based on multiple criteria
   */
  private static isExecutiveBriefingQualified(data: CreateAssessmentInput): boolean {
    // Complete contact information
    const hasCompleteContact = !!(
      data.firstName &&
      data.firstName.trim() &&
      data.lastName &&
      data.lastName.trim() &&
      data.company &&
      data.company.trim() &&
      data.phone &&
      data.phone.trim()
    );

    // Score-based qualification (needs help)
    const needsHelp = !!(
      data.totalScore !== null &&
      data.totalScore !== undefined &&
      data.totalScore < 60
    );

    // High-value company indicators
    const isHighValueCompany = this.checkCompanyValueIndicators(data);

    // Industry-specific criteria
    const qualifiesOnIndustry = this.checkIndustryQualification(data);

    return hasCompleteContact || needsHelp || isHighValueCompany || qualifiesOnIndustry;
  }

  /**
   * Checks for high-value company indicators
   */
  private static checkCompanyValueIndicators(data: CreateAssessmentInput): boolean {
    if (!data.company || !data.company.trim()) {
      return false;
    }

    const company = data.company.toLowerCase();

    // Company size indicators (from company name)
    const largeCompanyKeywords = ['corp', 'corporation', 'inc', 'llc', 'ltd', 'group', 'holdings'];
    const hasLargeCompanyIndicator = largeCompanyKeywords.some((keyword) =>
      company.includes(keyword)
    );

    // Critical customer safety issues (high-value signal)
    let hasCriticalCustomerSafetyIssues = false;
    if (data.scoreBreakdown && typeof data.scoreBreakdown === 'object') {
      const breakdown = data.scoreBreakdown as any;
      if (breakdown.customerSafe !== undefined) {
        hasCriticalCustomerSafetyIssues = breakdown.customerSafe < 50;
      }
    }

    return hasLargeCompanyIndicator || hasCriticalCustomerSafetyIssues;
  }

  /**
   * Checks for industry-based qualification
   */
  private static checkIndustryQualification(data: CreateAssessmentInput): boolean {
    if (!data.company || !data.company.trim()) {
      return false;
    }

    const company = data.company.toLowerCase();

    // High-value industries (could be enhanced with industry detection)
    const highValueIndustries = ['finance', 'banking', 'healthcare', 'technology', 'manufacturing'];

    // This could be enhanced with more sophisticated industry detection
    // For now, based on company name patterns or future industry selection
    return highValueIndustries.some((industry) => company.includes(industry));
  }
}
