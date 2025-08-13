/**
 * Rate Limiter Tests
 * Testing HubSpot API rate limiting for Free tier (100 requests per 10 seconds)
 *
 * TDD RED Phase: Testing real rate limiting functionality
 */

import { HubSpotRateLimiter } from '../../lib/utils/rate-limiter';

describe('HubSpot Rate Limiter - Real Functionality Tests', () => {
  let rateLimiter: HubSpotRateLimiter;

  beforeEach(() => {
    rateLimiter = new HubSpotRateLimiter();
  });

  describe('Rate Limit Checking', () => {
    test('should allow requests under the limit', async () => {
      // HubSpot Free tier: 100 requests per 10 seconds
      for (let i = 0; i < 99; i++) {
        const isAllowed = await rateLimiter.checkRateLimit();
        expect(isAllowed.allowed).toBe(true);
        expect(isAllowed.remainingRequests).toBe(100 - i - 1);
      }
    });

    test('should block requests that exceed the limit', async () => {
      // Fill up the rate limit bucket
      for (let i = 0; i < 100; i++) {
        await rateLimiter.checkRateLimit();
      }

      // This request should be blocked
      const blockedRequest = await rateLimiter.checkRateLimit();

      expect(blockedRequest.allowed).toBe(false);
      expect(blockedRequest.remainingRequests).toBe(0);
      expect(blockedRequest.resetTime).toBeDefined();
      expect(blockedRequest.retryAfter).toBeGreaterThan(0);
    });

    test('should reset rate limit after time window', async () => {
      // Create rate limiter with shorter window for testing
      const testRateLimiter = new HubSpotRateLimiter({
        maxRequests: 5,
        windowSeconds: 1, // 1 second window
      });

      // Fill up the rate limit
      for (let i = 0; i < 5; i++) {
        const result = await testRateLimiter.checkRateLimit();
        expect(result.allowed).toBe(true);
      }

      // Should be blocked
      const blockedResult = await testRateLimiter.checkRateLimit();
      expect(blockedResult.allowed).toBe(false);

      // Wait for reset (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be allowed again
      const allowedAfterReset = await testRateLimiter.checkRateLimit();
      expect(allowedAfterReset.allowed).toBe(true);
      expect(allowedAfterReset.remainingRequests).toBe(4);
    });
  });

  describe('Rate Limit Information', () => {
    test('should provide accurate remaining request count', async () => {
      // Make some requests and verify count decreases
      const initialCheck = await rateLimiter.checkRateLimit();
      expect(initialCheck.remainingRequests).toBe(99);

      const secondCheck = await rateLimiter.checkRateLimit();
      expect(secondCheck.remainingRequests).toBe(98);

      const thirdCheck = await rateLimiter.checkRateLimit();
      expect(thirdCheck.remainingRequests).toBe(97);
    });

    test('should calculate correct retry-after time when blocked', async () => {
      // Fill up rate limit
      for (let i = 0; i < 100; i++) {
        await rateLimiter.checkRateLimit();
      }

      const blockedResult = await rateLimiter.checkRateLimit();

      expect(blockedResult.retryAfter).toBeGreaterThan(0);
      expect(blockedResult.retryAfter).toBeLessThanOrEqual(10); // Should be within window
      expect(blockedResult.resetTime!.getTime()).toBeGreaterThan(Date.now());
    });

    test('should provide reset time information', async () => {
      const result = await rateLimiter.checkRateLimit();

      expect(result.resetTime).toBeDefined();
      expect(result.resetTime!.getTime()).toBeGreaterThan(Date.now());

      // Reset time should be approximately 10 seconds from now
      const timeUntilReset = result.resetTime!.getTime() - Date.now();
      expect(timeUntilReset).toBeGreaterThan(9000); // At least 9 seconds
      expect(timeUntilReset).toBeLessThanOrEqual(10000); // At most 10 seconds
    });
  });

  describe('Batch Request Handling', () => {
    test('should handle batch request checking', async () => {
      const batchSize = 25;
      const batchResult = await rateLimiter.checkBatchRateLimit(batchSize);

      expect(batchResult.allowed).toBe(true);
      expect(batchResult.remainingRequests).toBe(100 - batchSize);
      expect(batchResult.batchSize).toBe(batchSize);
    });

    test('should reject batch that would exceed limit', async () => {
      // Use up most of the rate limit
      for (let i = 0; i < 95; i++) {
        await rateLimiter.checkRateLimit();
      }

      // Try to make batch request for 10 (would exceed remaining 5)
      const batchResult = await rateLimiter.checkBatchRateLimit(10);

      expect(batchResult.allowed).toBe(false);
      expect(batchResult.remainingRequests).toBe(5);
      expect(batchResult.retryAfter).toBeGreaterThan(0);
    });

    test('should allow partial batch if requested', async () => {
      // Use up most of the rate limit
      for (let i = 0; i < 95; i++) {
        await rateLimiter.checkRateLimit();
      }

      // Try partial batch (allow up to remaining limit)
      const partialBatchResult = await rateLimiter.checkBatchRateLimit(10, { allowPartial: true });

      expect(partialBatchResult.allowed).toBe(true);
      expect(partialBatchResult.allowedBatchSize).toBe(5); // Only 5 remaining
      expect(partialBatchResult.remainingRequests).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid batch sizes', async () => {
      expect(async () => {
        await rateLimiter.checkBatchRateLimit(-1);
      }).rejects.toThrow('Batch size must be positive');

      expect(async () => {
        await rateLimiter.checkBatchRateLimit(0);
      }).rejects.toThrow('Batch size must be positive');
    });

    test('should handle very large batch sizes', async () => {
      const hugeBatchResult = await rateLimiter.checkBatchRateLimit(1000);

      expect(hugeBatchResult.allowed).toBe(false);
      expect(hugeBatchResult.remainingRequests).toBe(100);
    });
  });

  describe('Rate Limit Headers', () => {
    test('should generate appropriate rate limit headers', async () => {
      const result = await rateLimiter.checkRateLimit();
      const headers = rateLimiter.getRateLimitHeaders();

      expect(headers).toHaveProperty('X-RateLimit-Limit');
      expect(headers).toHaveProperty('X-RateLimit-Remaining');
      expect(headers).toHaveProperty('X-RateLimit-Reset');

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(parseInt(headers['X-RateLimit-Remaining'])).toBe(result.remainingRequests);
      expect(new Date(headers['X-RateLimit-Reset']).getTime()).toBeGreaterThan(Date.now());
    });

    test('should include retry-after header when rate limited', async () => {
      // Fill up rate limit
      for (let i = 0; i < 100; i++) {
        await rateLimiter.checkRateLimit();
      }

      await rateLimiter.checkRateLimit(); // This should be blocked
      const headers = rateLimiter.getRateLimitHeaders();

      expect(headers).toHaveProperty('Retry-After');
      expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0);
      expect(parseInt(headers['Retry-After'])).toBeLessThanOrEqual(10);
    });
  });

  describe('Configuration Options', () => {
    test('should respect custom configuration', () => {
      const customLimiter = new HubSpotRateLimiter({
        maxRequests: 50,
        windowSeconds: 5,
        identifier: 'custom-client',
      });

      expect(customLimiter.getConfiguration()).toEqual({
        maxRequests: 50,
        windowSeconds: 5,
        identifier: 'custom-client',
      });
    });

    test('should use default configuration when not specified', () => {
      const defaultLimiter = new HubSpotRateLimiter();
      const config = defaultLimiter.getConfiguration();

      expect(config.maxRequests).toBe(100);
      expect(config.windowSeconds).toBe(10);
      expect(config.identifier).toBe('default');
    });
  });

  describe('Multiple Client Support', () => {
    test('should track different clients separately', async () => {
      const client1 = new HubSpotRateLimiter({ identifier: 'client1' });
      const client2 = new HubSpotRateLimiter({ identifier: 'client2' });

      // Use up client1's limit
      for (let i = 0; i < 100; i++) {
        await client1.checkRateLimit();
      }

      // Client1 should be blocked
      const client1Blocked = await client1.checkRateLimit();
      expect(client1Blocked.allowed).toBe(false);

      // Client2 should still be allowed
      const client2Allowed = await client2.checkRateLimit();
      expect(client2Allowed.allowed).toBe(true);
      expect(client2Allowed.remainingRequests).toBe(99);
    });
  });

  describe('Performance and Memory', () => {
    test('should clean up expired rate limit entries', async () => {
      // Create rate limiter with short window for testing
      const shortWindowLimiter = new HubSpotRateLimiter({
        maxRequests: 10,
        windowSeconds: 1,
      });

      // Make requests to create entries
      for (let i = 0; i < 5; i++) {
        await shortWindowLimiter.checkRateLimit();
      }

      // Wait for entries to expire
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Make new request (should trigger cleanup)
      const result = await shortWindowLimiter.checkRateLimit();

      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(9); // Should have reset
    });
  });
});
