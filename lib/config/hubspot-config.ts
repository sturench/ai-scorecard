/**
 * HubSpot Integration Configuration
 * Centralized configuration management with validation and defaults
 */

import { logger } from '../utils/logger';

export interface HubSpotConfig {
  // API Configuration
  accessToken: string;
  baseUrl: string;
  timeout: number;

  // Rate Limiting
  rateLimiting: {
    maxRequests: number;
    windowSeconds: number;
    enableRateLimiting: boolean;
    warningThreshold: number; // Percentage at which to log warnings
  };

  // Retry Configuration
  retry: {
    maxAttempts: number;
    baseDelay: number; // seconds
    maxDelay: number; // seconds
    backoffMultiplier: number;
    retryableErrors: string[];
  };

  // Queue Configuration
  queue: {
    batchSize: number;
    processingInterval: number; // seconds
    maxQueueSize: number;
    deadLetterThreshold: number; // max failures before dead letter
    cleanupInterval: number; // seconds
  };

  // Lead Qualification Thresholds
  qualification: {
    executiveBriefingScoreThreshold: number;
    largeCompanyKeywords: string[];
    highValueIndustries: string[];
    criticalSafetyScoreThreshold: number;
  };

  // Deal Configuration
  deals: {
    defaultAmount: string;
    defaultPipeline: string;
    defaultStage: string;
    daysToClose: number;
  };

  // Monitoring & Logging
  monitoring: {
    enableHealthChecks: boolean;
    healthCheckInterval: number; // seconds
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    metricsRetentionDays: number;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: HubSpotConfig = {
  // API Configuration
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN || '',
  baseUrl: 'https://api.hubapi.com',
  timeout: 30000, // 30 seconds

  // Rate Limiting (HubSpot Free tier defaults)
  rateLimiting: {
    maxRequests: 100,
    windowSeconds: 10,
    enableRateLimiting: true,
    warningThreshold: 80, // Warn when 80% of limit is reached
  },

  // Retry Configuration
  retry: {
    maxAttempts: 5,
    baseDelay: 60, // 1 minute
    maxDelay: 3600, // 1 hour
    backoffMultiplier: 2,
    retryableErrors: ['rate_limit', 'server_error', 'network_error', 'timeout'],
  },

  // Queue Configuration
  queue: {
    batchSize: 10,
    processingInterval: 60, // 1 minute
    maxQueueSize: 10000,
    deadLetterThreshold: 5,
    cleanupInterval: 3600, // 1 hour
  },

  // Lead Qualification Thresholds
  qualification: {
    executiveBriefingScoreThreshold: 60,
    largeCompanyKeywords: [
      'corp',
      'corporation',
      'inc',
      'llc',
      'ltd',
      'group',
      'holdings',
      'enterprises',
      'international',
      'global',
      'worldwide',
      'company',
    ],
    highValueIndustries: [
      'finance',
      'banking',
      'healthcare',
      'technology',
      'manufacturing',
      'pharmaceuticals',
      'insurance',
      'consulting',
      'aerospace',
      'automotive',
    ],
    criticalSafetyScoreThreshold: 50,
  },

  // Deal Configuration
  deals: {
    defaultAmount: '5000',
    defaultPipeline: 'ai_consulting_pipeline',
    defaultStage: 'executive_briefing_requested',
    daysToClose: 30,
  },

  // Monitoring & Logging
  monitoring: {
    enableHealthChecks: true,
    healthCheckInterval: 300, // 5 minutes
    logLevel: (process.env.NODE_ENV === 'development' ? 'debug' : 'info') as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error',
    enableMetrics: true,
    metricsRetentionDays: 30,
  },
};

/**
 * Environment-specific configuration overrides
 */
function getEnvironmentOverrides(): Partial<HubSpotConfig> {
  const overrides: Partial<HubSpotConfig> = {};

  // Production overrides
  if (process.env.NODE_ENV === 'production') {
    overrides.monitoring = {
      ...DEFAULT_CONFIG.monitoring,
      logLevel: 'info',
      healthCheckInterval: 600, // 10 minutes in production
    };
  }

  // Test overrides
  if (process.env.NODE_ENV === 'test') {
    overrides.rateLimiting = {
      ...DEFAULT_CONFIG.rateLimiting,
      enableRateLimiting: false, // Disable rate limiting in tests
    };
    overrides.retry = {
      ...DEFAULT_CONFIG.retry,
      baseDelay: 0, // No delay in tests
      maxAttempts: 2, // Fewer retries in tests
    };
    overrides.monitoring = {
      ...DEFAULT_CONFIG.monitoring,
      enableHealthChecks: false,
      logLevel: 'error', // Reduce noise in tests
    };
  }

  // Custom environment variables
  if (process.env.HUBSPOT_MAX_REQUESTS) {
    overrides.rateLimiting = {
      ...overrides.rateLimiting,
      maxRequests: parseInt(process.env.HUBSPOT_MAX_REQUESTS, 10),
    };
  }

  if (process.env.HUBSPOT_RATE_WINDOW) {
    overrides.rateLimiting = {
      ...overrides.rateLimiting,
      windowSeconds: parseInt(process.env.HUBSPOT_RATE_WINDOW, 10),
    };
  }

  if (process.env.HUBSPOT_MAX_RETRIES) {
    overrides.retry = {
      ...overrides.retry,
      maxAttempts: parseInt(process.env.HUBSPOT_MAX_RETRIES, 10),
    };
  }

  if (process.env.LOG_LEVEL) {
    overrides.monitoring = {
      ...overrides.monitoring,
      logLevel: process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
    };
  }

  return overrides;
}

/**
 * Configuration manager with validation and environment handling
 */
export class HubSpotConfigManager {
  private static instance: HubSpotConfigManager;
  private config: HubSpotConfig;
  private readonly component = 'hubspot-config';

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  static getInstance(): HubSpotConfigManager {
    if (!HubSpotConfigManager.instance) {
      HubSpotConfigManager.instance = new HubSpotConfigManager();
    }
    return HubSpotConfigManager.instance;
  }

  /**
   * Gets the complete configuration
   */
  getConfig(): HubSpotConfig {
    return { ...this.config };
  }

  /**
   * Gets a specific configuration section
   */
  getSection<T extends keyof HubSpotConfig>(section: T): HubSpotConfig[T] {
    return this.config[section];
  }

  /**
   * Updates configuration at runtime
   */
  updateConfig(updates: Partial<HubSpotConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.validateConfig();

    logger.info('HubSpot configuration updated', {
      component: this.component,
      updatedSections: Object.keys(updates),
    });
  }

  /**
   * Loads configuration from defaults and environment
   */
  private loadConfig(): HubSpotConfig {
    const envOverrides = getEnvironmentOverrides();
    return this.mergeConfig(DEFAULT_CONFIG, envOverrides);
  }

  /**
   * Deep merges configuration objects
   */
  private mergeConfig(base: HubSpotConfig, overrides: Partial<HubSpotConfig>): HubSpotConfig {
    const result = { ...base };

    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Deep merge objects
          (result as any)[key] = {
            ...(result as any)[key],
            ...value,
          };
        } else {
          // Direct assignment for primitives and arrays
          (result as any)[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Validates configuration values
   */
  private validateConfig(): void {
    const errors: string[] = [];

    // Required fields
    if (!this.config.accessToken) {
      errors.push('HubSpot access token is required');
    }

    // Rate limiting validation
    if (this.config.rateLimiting.maxRequests <= 0) {
      errors.push('Rate limiting maxRequests must be positive');
    }

    if (this.config.rateLimiting.windowSeconds <= 0) {
      errors.push('Rate limiting windowSeconds must be positive');
    }

    // Retry validation
    if (this.config.retry.maxAttempts < 0) {
      errors.push('Retry maxAttempts cannot be negative');
    }

    if (this.config.retry.baseDelay < 0) {
      errors.push('Retry baseDelay cannot be negative');
    }

    // Queue validation
    if (this.config.queue.batchSize <= 0) {
      errors.push('Queue batchSize must be positive');
    }

    if (this.config.queue.maxQueueSize <= 0) {
      errors.push('Queue maxQueueSize must be positive');
    }

    // Qualification validation
    if (
      this.config.qualification.executiveBriefingScoreThreshold < 0 ||
      this.config.qualification.executiveBriefingScoreThreshold > 100
    ) {
      errors.push('Executive briefing score threshold must be between 0 and 100');
    }

    // Log errors but don't throw in production
    if (errors.length > 0) {
      const errorMessage = `HubSpot configuration validation errors: ${errors.join(', ')}`;

      if (process.env.NODE_ENV === 'production') {
        logger.error(errorMessage, new Error(errorMessage), {
          component: this.component,
          validationErrors: errors,
        });
      } else {
        throw new Error(errorMessage);
      }
    }

    logger.info('HubSpot configuration validated successfully', {
      component: this.component,
      environment: process.env.NODE_ENV,
      rateLimitEnabled: this.config.rateLimiting.enableRateLimiting,
      maxRetries: this.config.retry.maxAttempts,
    });
  }

  /**
   * Gets configuration summary for logging/debugging
   */
  getConfigSummary(): Record<string, any> {
    return {
      hasAccessToken: !!this.config.accessToken,
      rateLimiting: {
        enabled: this.config.rateLimiting.enableRateLimiting,
        maxRequests: this.config.rateLimiting.maxRequests,
        windowSeconds: this.config.rateLimiting.windowSeconds,
      },
      retry: {
        maxAttempts: this.config.retry.maxAttempts,
        baseDelay: this.config.retry.baseDelay,
      },
      queue: {
        batchSize: this.config.queue.batchSize,
        processingInterval: this.config.queue.processingInterval,
      },
      monitoring: {
        logLevel: this.config.monitoring.logLevel,
        healthChecksEnabled: this.config.monitoring.enableHealthChecks,
      },
    };
  }
}

// Export singleton instance
export const hubspotConfig = HubSpotConfigManager.getInstance();
