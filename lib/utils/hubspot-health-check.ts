/**
 * HubSpot Integration Health Check and Monitoring
 * Provides health status, performance metrics, and operational monitoring
 */

import { Client } from '@hubspot/api-client';
import { prisma } from '../prisma';
import { HubSpotRateLimiter } from './rate-limiter';
import { logger } from './logger';

export interface HealthCheckResult {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    hubspotApi: HealthCheck;
    database: HealthCheck;
    rateLimiter: HealthCheck;
    queueHealth: HealthCheck;
  };
  metrics: PerformanceMetrics;
}

export interface HealthCheck {
  healthy: boolean;
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface PerformanceMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number;
  averageResponseTime: number;
  pendingQueueSize: number;
  rateLimitUtilization: number;
  lastSyncTime?: string;
}

export class HubSpotHealthMonitor {
  private client: Client | null = null;
  private rateLimiter: HubSpotRateLimiter;
  private readonly component = 'hubspot-health-monitor';

  constructor() {
    this.rateLimiter = new HubSpotRateLimiter();

    // Initialize HubSpot client if token is available
    if (process.env.HUBSPOT_ACCESS_TOKEN) {
      try {
        this.client = new Client({
          accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
        });
      } catch (error) {
        logger.warn('Failed to initialize HubSpot client for health checks', {
          component: this.component,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Performs comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const operationId = logger.operationStart('health-check', {
      component: this.component,
    });

    try {
      // Perform all health checks in parallel
      const [hubspotCheck, dbCheck, rateLimiterCheck, queueCheck, metrics] = await Promise.all([
        this.checkHubSpotAPI(),
        this.checkDatabase(),
        this.checkRateLimiter(),
        this.checkQueueHealth(),
        this.gatherMetrics(),
      ]);

      // Determine overall health status
      const allChecks = [hubspotCheck, dbCheck, rateLimiterCheck, queueCheck];
      const healthy = allChecks.every((check) => check.healthy);
      const someUnhealthy = allChecks.some((check) => !check.healthy);

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthy) {
        status = 'healthy';
      } else if (someUnhealthy && allChecks.some((check) => check.healthy)) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      const result: HealthCheckResult = {
        healthy,
        status,
        timestamp: new Date().toISOString(),
        checks: {
          hubspotApi: hubspotCheck,
          database: dbCheck,
          rateLimiter: rateLimiterCheck,
          queueHealth: queueCheck,
        },
        metrics,
      };

      const duration = Date.now() - startTime;
      logger.operationComplete('health-check', operationId, duration, {
        component: this.component,
        status,
        healthy,
        successRate: metrics.successRate,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.operationFailed('health-check', operationId, duration, error as Error, {
        component: this.component,
      });

      return {
        healthy: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          hubspotApi: { healthy: false, error: 'Health check failed' },
          database: { healthy: false, error: 'Health check failed' },
          rateLimiter: { healthy: false, error: 'Health check failed' },
          queueHealth: { healthy: false, error: 'Health check failed' },
        },
        metrics: {
          totalSyncs: 0,
          successfulSyncs: 0,
          failedSyncs: 0,
          successRate: 0,
          averageResponseTime: 0,
          pendingQueueSize: 0,
          rateLimitUtilization: 0,
        },
      };
    }
  }

  /**
   * Checks HubSpot API connectivity and response
   */
  private async checkHubSpotAPI(): Promise<HealthCheck> {
    if (!this.client) {
      return {
        healthy: false,
        error: 'HubSpot client not initialized (missing access token)',
      };
    }

    const startTime = Date.now();

    try {
      // Make a simple API call to test connectivity
      // Using account info endpoint as it's lightweight
      await this.client.auth.oauth.accessTokensApi.get(process.env.HUBSPOT_ACCESS_TOKEN!);

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
        details: {
          endpoint: 'oauth/v1/access-tokens',
          tokenValid: true,
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        healthy: false,
        responseTime,
        error: error.message || 'HubSpot API check failed',
        details: {
          statusCode: error.response?.status,
          errorType: error.code || 'unknown',
        },
      };
    }
  }

  /**
   * Checks database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Test database connectivity with a simple query
      await prisma.$queryRaw`SELECT 1 as health_check`;

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
        details: {
          connection: 'active',
          querySuccessful: true,
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        healthy: false,
        responseTime,
        error: error.message || 'Database check failed',
        details: {
          errorCode: error.code,
        },
      };
    }
  }

  /**
   * Checks rate limiter status and availability
   */
  private async checkRateLimiter(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const rateLimitStatus = await this.rateLimiter.checkRateLimit();
      const responseTime = Date.now() - startTime;

      // Roll back the test request
      const config = this.rateLimiter.getConfiguration();

      return {
        healthy: true,
        responseTime,
        details: {
          remainingRequests: rateLimitStatus.remainingRequests,
          maxRequests: config.maxRequests,
          windowSeconds: config.windowSeconds,
          resetTime: rateLimitStatus.resetTime?.toISOString(),
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        healthy: false,
        responseTime,
        error: error.message || 'Rate limiter check failed',
      };
    }
  }

  /**
   * Checks HubSpot sync queue health
   */
  private async checkQueueHealth(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const [pendingCount, failedCount, recentFailures] = await Promise.all([
        prisma.hubspotSyncQueue.count({ where: { status: 'pending' } }),
        prisma.hubspotSyncQueue.count({ where: { status: 'failed' } }),
        prisma.hubspotSyncQueue.count({
          where: {
            status: 'failed',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
          },
        }),
      ]);

      const responseTime = Date.now() - startTime;

      // Consider queue unhealthy if too many recent failures or too many pending items
      const tooManyFailures = recentFailures > 50;
      const queueBacklogged = pendingCount > 1000;
      const healthy = !tooManyFailures && !queueBacklogged;

      return {
        healthy,
        responseTime,
        details: {
          pendingCount,
          failedCount,
          recentFailures,
          queueBacklogged,
          tooManyFailures,
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        healthy: false,
        responseTime,
        error: error.message || 'Queue health check failed',
      };
    }
  }

  /**
   * Gathers performance and operational metrics
   */
  private async gatherMetrics(): Promise<PerformanceMetrics> {
    try {
      const [totalEntries, completedEntries, failedEntries, lastSync] = await Promise.all([
        prisma.hubspotSyncQueue.count(),
        prisma.hubspotSyncQueue.count({ where: { status: 'completed' } }),
        prisma.hubspotSyncQueue.count({ where: { status: 'failed' } }),
        prisma.hubspotSyncQueue.findFirst({
          where: { status: 'completed' },
          orderBy: { processedAt: 'desc' },
          select: { processedAt: true },
        }),
      ]);

      const pendingEntries = await prisma.hubspotSyncQueue.count({
        where: { status: 'pending' },
      });

      // Calculate success rate
      const processedEntries = completedEntries + failedEntries;
      const successRate = processedEntries > 0 ? (completedEntries / processedEntries) * 100 : 0;

      // Get rate limiter utilization
      const rateLimitStatus = await this.rateLimiter.checkRateLimit();
      const config = this.rateLimiter.getConfiguration();
      const rateLimitUtilization =
        ((config.maxRequests - rateLimitStatus.remainingRequests) / config.maxRequests) * 100;

      return {
        totalSyncs: totalEntries,
        successfulSyncs: completedEntries,
        failedSyncs: failedEntries,
        successRate: Math.round(successRate * 100) / 100,
        averageResponseTime: 0, // TODO: Calculate from actual response times
        pendingQueueSize: pendingEntries,
        rateLimitUtilization: Math.round(rateLimitUtilization * 100) / 100,
        lastSyncTime: lastSync?.processedAt?.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to gather performance metrics', error as Error, {
        component: this.component,
      });

      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        successRate: 0,
        averageResponseTime: 0,
        pendingQueueSize: 0,
        rateLimitUtilization: 0,
      };
    }
  }

  /**
   * Gets queue statistics for monitoring
   */
  async getQueueStatistics(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    oldestPending?: string;
    newestPending?: string;
  }> {
    try {
      const [counts, oldestPending, newestPending] = await Promise.all([
        prisma.hubspotSyncQueue.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.hubspotSyncQueue.findFirst({
          where: { status: 'pending' },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
        prisma.hubspotSyncQueue.findFirst({
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        oldestPending: oldestPending?.createdAt?.toISOString(),
        newestPending: newestPending?.createdAt?.toISOString(),
      };

      for (const count of counts) {
        stats[count.status as keyof typeof stats] = count._count.id;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get queue statistics', error as Error, {
        component: this.component,
      });

      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }
  }
}

// Export singleton instance
export const hubspotHealthMonitor = new HubSpotHealthMonitor();
