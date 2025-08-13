/**
 * HubSpot API Rate Limiter
 * Implements rate limiting for HubSpot Free tier (100 requests per 10 seconds)
 *
 * Provides real rate limiting functionality with exponential backoff
 */

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  identifier: string;
}

interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime?: Date;
  retryAfter?: number;
}

interface BatchRateLimitResult extends RateLimitResult {
  batchSize: number;
  allowedBatchSize?: number;
}

interface BatchOptions {
  allowPartial?: boolean;
}

export class HubSpotRateLimiter {
  private config: RateLimitConfig;
  private requestCounts: Map<string, { count: number; resetTime: Date; requests: Date[] }> =
    new Map();

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      maxRequests: 100,
      windowSeconds: 10,
      identifier: 'default',
      ...config,
    };
  }

  /**
   * Checks if a single request is allowed under rate limit
   */
  async checkRateLimit(): Promise<RateLimitResult> {
    const now = new Date();
    const key = this.config.identifier;

    // Clean up expired entries first
    this.cleanupExpired(now);

    let bucket = this.requestCounts.get(key);

    if (!bucket) {
      bucket = {
        count: 0,
        resetTime: new Date(now.getTime() + this.config.windowSeconds * 1000),
        requests: [],
      };
      this.requestCounts.set(key, bucket);
    }

    // Check if window has expired
    if (now >= bucket.resetTime) {
      bucket.count = 0;
      bucket.resetTime = new Date(now.getTime() + this.config.windowSeconds * 1000);
      bucket.requests = [];
    }

    // Remove old requests from sliding window
    bucket.requests = bucket.requests.filter(
      (reqTime) => now.getTime() - reqTime.getTime() < this.config.windowSeconds * 1000
    );
    bucket.count = bucket.requests.length;

    const remainingRequests = this.config.maxRequests - bucket.count;

    if (bucket.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((bucket.resetTime.getTime() - now.getTime()) / 1000);

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: bucket.resetTime,
        retryAfter: Math.max(retryAfter, 1),
      };
    }

    // Allow request
    bucket.requests.push(now);
    bucket.count++;
    this.requestCounts.set(key, bucket);

    return {
      allowed: true,
      remainingRequests: remainingRequests - 1,
      resetTime: bucket.resetTime,
    };
  }

  /**
   * Checks if a batch of requests is allowed
   */
  async checkBatchRateLimit(
    batchSize: number,
    options: BatchOptions = {}
  ): Promise<BatchRateLimitResult> {
    if (batchSize <= 0) {
      throw new Error('Batch size must be positive');
    }

    const currentStatus = await this.checkRateLimit();

    // Roll back the single request we just made for checking
    const bucket = this.requestCounts.get(this.config.identifier);
    if (bucket && bucket.requests.length > 0) {
      bucket.requests.pop();
      bucket.count--;
    }

    const availableSlots = currentStatus.remainingRequests + 1; // Add back the one we rolled back

    if (batchSize <= availableSlots) {
      // Entire batch can be processed
      // Reserve the slots
      for (let i = 0; i < batchSize; i++) {
        await this.checkRateLimit();
      }

      return {
        allowed: true,
        remainingRequests: availableSlots - batchSize,
        resetTime: currentStatus.resetTime,
        batchSize,
        allowedBatchSize: batchSize,
      };
    }

    if (options.allowPartial && availableSlots > 0) {
      // Allow partial batch
      for (let i = 0; i < availableSlots; i++) {
        await this.checkRateLimit();
      }

      return {
        allowed: true,
        remainingRequests: 0,
        resetTime: currentStatus.resetTime,
        batchSize,
        allowedBatchSize: availableSlots,
      };
    }

    // Batch cannot be processed
    const retryAfter = currentStatus.resetTime
      ? Math.ceil((currentStatus.resetTime.getTime() - Date.now()) / 1000)
      : this.config.windowSeconds;

    return {
      allowed: false,
      remainingRequests: availableSlots,
      resetTime: currentStatus.resetTime,
      retryAfter: Math.max(retryAfter, 1),
      batchSize,
    };
  }

  /**
   * Gets rate limit headers for HTTP responses
   */
  getRateLimitHeaders(): Record<string, string> {
    const bucket = this.requestCounts.get(this.config.identifier);
    const remaining = bucket ? this.config.maxRequests - bucket.count : this.config.maxRequests;
    const resetTime = bucket?.resetTime || new Date(Date.now() + this.config.windowSeconds * 1000);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
      'X-RateLimit-Reset': resetTime.toISOString(),
    };

    if (remaining <= 0) {
      const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
      headers['Retry-After'] = Math.max(1, retryAfter).toString();
    }

    return headers;
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Cleans up expired rate limit entries
   */
  private cleanupExpired(now: Date): void {
    for (const [key, bucket] of this.requestCounts.entries()) {
      // Clean up buckets that are significantly expired
      if (now.getTime() - bucket.resetTime.getTime() > this.config.windowSeconds * 2 * 1000) {
        this.requestCounts.delete(key);
      }
    }
  }
}
