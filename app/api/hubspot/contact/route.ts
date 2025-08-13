/**
 * HubSpot Contact API Route
 * Creates or updates HubSpot contacts with lead qualification and retry logic
 *
 * Implements real HTTP API functionality with error handling and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { HubSpotService } from '../../../../lib/services/hubspot';
import { HubSpotRetryService } from '../../../../lib/services/hubspot-retry';
import { LeadQualificationService } from '../../../../lib/services/lead-qualification';
import type { CreateAssessmentInput } from '../../../../lib/types/database';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate request body
    const body = await request.text();
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request body required',
        },
        { status: 400 }
      );
    }

    let assessmentData: CreateAssessmentInput;
    try {
      assessmentData = JSON.parse(body);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body - must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!assessmentData.sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionId is required for validation',
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (assessmentData.email && !isValidEmail(assessmentData.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Get qualification details
    const qualification = LeadQualificationService.qualifyLead(assessmentData);

    // Initialize services
    const hubspotService = new HubSpotService();
    const retryService = new HubSpotRetryService();

    try {
      // Attempt HubSpot sync
      const result = await hubspotService.createOrUpdateContact(assessmentData);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Create response with proper headers
      const response = NextResponse.json({
        success: true,
        contactId: result.contactId,
        dealId: result.dealId,
        qualification,
        skipped: result.skipped,
        reason: result.reason,
      });

      // Add performance and status headers
      response.headers.set('X-Response-Time', responseTime.toString());
      response.headers.set('X-HubSpot-Sync-Status', result.skipped ? 'skipped' : 'success');

      return response;
    } catch (hubspotError) {
      // Handle HubSpot API failures - queue for retry
      const errorMessage =
        hubspotError instanceof Error ? hubspotError.message : 'Unknown HubSpot error';
      const errorType = determineErrorType(hubspotError);

      // Create a placeholder assessment ID for queuing (in real implementation, this would exist)
      const assessmentId = `assessment-${assessmentData.sessionId}`;

      // Queue for retry with appropriate priority based on error type
      const priority = errorType === 'rate_limit' ? 3 : 5; // Higher priority for rate limits
      await retryService.queueForRetry(assessmentId, assessmentData, errorType, { priority });

      // Return error response
      return NextResponse.json(
        {
          success: false,
          error: 'HUBSPOT_SYNC_FAILED',
          message: errorMessage,
          qualification,
          queuedForRetry: true,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Determines error type for retry queue classification
 */
function determineErrorType(
  error: unknown
): 'rate_limit' | 'auth_error' | 'validation_error' | 'server_error' {
  if (!error || typeof error !== 'object') {
    return 'server_error';
  }

  const errorMessage = 'message' in error ? String(error.message).toLowerCase() : '';
  const errorName = 'name' in error ? String(error.name).toLowerCase() : '';

  if (
    errorMessage.includes('rate limit') ||
    errorName.includes('ratelimit') ||
    errorMessage.includes('429')
  ) {
    return 'rate_limit';
  }

  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('401')
  ) {
    return 'auth_error';
  }

  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('400')
  ) {
    return 'validation_error';
  }

  return 'server_error';
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
