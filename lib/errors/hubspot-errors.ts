/**
 * HubSpot-specific Error Classes and Error Handling
 * Provides structured error handling for HubSpot API integration
 */

export enum HubSpotErrorType {
  AUTHENTICATION = 'auth_error',
  RATE_LIMIT = 'rate_limit',
  VALIDATION = 'validation_error',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_PROPERTY = 'invalid_property',
}

export interface HubSpotErrorDetails {
  code?: string;
  statusCode?: number;
  rateLimitReset?: Date;
  retryAfter?: number;
  requestId?: string;
  category: HubSpotErrorType;
  originalError?: Error;
  context?: Record<string, any>;
}

/**
 * Base HubSpot error class with structured error information
 */
export class HubSpotError extends Error {
  public readonly details: HubSpotErrorDetails;
  public readonly timestamp: Date;
  public readonly isRetryable: boolean;

  constructor(message: string, details: HubSpotErrorDetails) {
    super(message);
    this.name = 'HubSpotError';
    this.details = details;
    this.timestamp = new Date();
    this.isRetryable = this.determineRetryability(details.category);

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HubSpotError);
    }
  }

  /**
   * Determines if error is retryable based on category
   */
  private determineRetryability(category: HubSpotErrorType): boolean {
    switch (category) {
      case HubSpotErrorType.RATE_LIMIT:
      case HubSpotErrorType.SERVER_ERROR:
      case HubSpotErrorType.NETWORK_ERROR:
        return true;
      case HubSpotErrorType.AUTHENTICATION:
      case HubSpotErrorType.VALIDATION:
      case HubSpotErrorType.QUOTA_EXCEEDED:
      case HubSpotErrorType.INVALID_PROPERTY:
        return false;
      default:
        return false;
    }
  }

  /**
   * Convert to JSON for logging and storage
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      isRetryable: this.isRetryable,
      stack: this.stack,
    };
  }
}

/**
 * Factory for creating HubSpot errors from various sources
 */
export class HubSpotErrorFactory {
  /**
   * Creates HubSpot error from API response
   */
  static fromApiResponse(response: any, originalError?: Error): HubSpotError {
    const statusCode = response?.status || response?.statusCode;
    const errorBody = response?.body || response?.data || response;

    let category: HubSpotErrorType;
    let message = 'HubSpot API error';
    let retryAfter: number | undefined;

    // Categorize based on HTTP status code
    switch (statusCode) {
      case 401:
      case 403:
        category = HubSpotErrorType.AUTHENTICATION;
        message = 'HubSpot authentication failed';
        break;
      case 429:
        category = HubSpotErrorType.RATE_LIMIT;
        message = 'HubSpot rate limit exceeded';
        retryAfter = this.extractRetryAfter(response);
        break;
      case 400:
        category = HubSpotErrorType.VALIDATION;
        message = 'HubSpot validation error';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        category = HubSpotErrorType.SERVER_ERROR;
        message = 'HubSpot server error';
        break;
      default:
        category = HubSpotErrorType.SERVER_ERROR;
        message = 'Unknown HubSpot API error';
    }

    // Extract more specific error message from response
    if (errorBody?.message) {
      message = `${message}: ${errorBody.message}`;
    } else if (errorBody?.error?.message) {
      message = `${message}: ${errorBody.error.message}`;
    }

    const details: HubSpotErrorDetails = {
      code: errorBody?.error?.code || errorBody?.errorType,
      statusCode,
      category,
      originalError,
      retryAfter,
      requestId: response?.headers?.['x-request-id'] || errorBody?.requestId,
      context: {
        response: errorBody,
        url: response?.config?.url,
        method: response?.config?.method,
      },
    };

    if (retryAfter) {
      details.rateLimitReset = new Date(Date.now() + retryAfter * 1000);
    }

    return new HubSpotError(message, details);
  }

  /**
   * Creates HubSpot error from network/connection error
   */
  static fromNetworkError(error: Error): HubSpotError {
    const details: HubSpotErrorDetails = {
      category: HubSpotErrorType.NETWORK_ERROR,
      originalError: error,
      context: {
        errorCode: (error as any).code,
        syscall: (error as any).syscall,
        hostname: (error as any).hostname,
      },
    };

    return new HubSpotError(`HubSpot network error: ${error.message}`, details);
  }

  /**
   * Creates HubSpot error for validation issues
   */
  static validationError(message: string, context?: Record<string, any>): HubSpotError {
    const details: HubSpotErrorDetails = {
      category: HubSpotErrorType.VALIDATION,
      context,
    };

    return new HubSpotError(`HubSpot validation error: ${message}`, details);
  }

  /**
   * Creates HubSpot error for authentication issues
   */
  static authenticationError(message: string = 'Invalid or missing access token'): HubSpotError {
    const details: HubSpotErrorDetails = {
      category: HubSpotErrorType.AUTHENTICATION,
    };

    return new HubSpotError(`HubSpot authentication error: ${message}`, details);
  }

  /**
   * Extracts retry-after value from response headers
   */
  private static extractRetryAfter(response: any): number | undefined {
    const retryAfterHeader =
      response?.headers?.['retry-after'] || response?.headers?.['Retry-After'];

    if (retryAfterHeader) {
      const parsed = parseInt(retryAfterHeader, 10);
      return isNaN(parsed) ? undefined : parsed;
    }

    // HubSpot might include retry information in response body
    const resetTime = response?.body?.resetTime || response?.data?.resetTime;
    if (resetTime) {
      const resetDate = new Date(resetTime);
      const now = new Date();
      return Math.max(1, Math.ceil((resetDate.getTime() - now.getTime()) / 1000));
    }

    return undefined;
  }
}

/**
 * Error handler for HubSpot operations
 */
export class HubSpotErrorHandler {
  /**
   * Handles and categorizes HubSpot errors
   */
  static handleError(error: any): HubSpotError {
    if (error instanceof HubSpotError) {
      return error;
    }

    // Network/connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return HubSpotErrorFactory.fromNetworkError(error);
    }

    // API response errors
    if (error.response || error.status) {
      return HubSpotErrorFactory.fromApiResponse(error.response || error, error);
    }

    // Generic error fallback
    const details: HubSpotErrorDetails = {
      category: HubSpotErrorType.SERVER_ERROR,
      originalError: error,
    };

    return new HubSpotError(`Unexpected HubSpot error: ${error.message || error}`, details);
  }

  /**
   * Determines if error should trigger a retry
   */
  static shouldRetry(error: HubSpotError, currentRetryCount: number, maxRetries: number): boolean {
    if (currentRetryCount >= maxRetries) {
      return false;
    }

    return error.isRetryable;
  }

  /**
   * Calculates delay before next retry based on error type
   */
  static calculateRetryDelay(error: HubSpotError, retryCount: number): number {
    if (error.details.category === HubSpotErrorType.RATE_LIMIT && error.details.retryAfter) {
      // Use HubSpot's retry-after header
      return error.details.retryAfter;
    }

    // Exponential backoff for other retryable errors
    const baseDelay = 60; // 1 minute
    const delays = [baseDelay, baseDelay * 5, baseDelay * 15, baseDelay * 30, baseDelay * 60];

    return delays[Math.min(retryCount, delays.length - 1)];
  }
}
