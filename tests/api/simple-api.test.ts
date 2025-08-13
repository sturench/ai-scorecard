/**
 * Simple API test demonstrating basic testing patterns
 * This shows how to test API routes with simpler mocking
 */

import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';

// Simple API handler for demonstration
const simpleApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }

  return res.status(200).json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    success: true,
  });
};

describe('Simple API Route', () => {
  describe('GET requests', () => {
    it('should return greeting with name', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { name: 'World' },
      });

      await simpleApiHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe('Hello, World!');
      expect(responseData.success).toBe(true);
      expect(responseData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return 400 when name is missing', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {},
      });

      await simpleApiHandler(req, res);

      expect(res._getStatusCode()).toBe(400);

      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Name parameter is required');
    });

    it('should handle special characters in name', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { name: 'José & María' },
      });

      await simpleApiHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe('Hello, José & María!');
    });
  });

  describe('Non-GET requests', () => {
    it('should return 405 for POST requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { name: 'World' },
      });

      await simpleApiHandler(req, res);

      expect(res._getStatusCode()).toBe(405);

      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Method not allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PUT',
        query: { name: 'World' },
      });

      await simpleApiHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });

    it('should return 405 for DELETE requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'DELETE',
      });

      await simpleApiHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });
});

// Test utility functions
describe('API Response Utilities', () => {
  it('should format timestamps correctly', () => {
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should handle query parameters', () => {
    const { req } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        name: 'test',
        id: '123',
        active: 'true',
      },
    });

    expect(req.query.name).toBe('test');
    expect(req.query.id).toBe('123');
    expect(req.query.active).toBe('true');
  });

  it('should handle request body parsing', () => {
    const testBody = { message: 'test', count: 42 };

    const { req } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: testBody,
    });

    expect(req.body).toEqual(testBody);
    expect(req.body.message).toBe('test');
    expect(req.body.count).toBe(42);
  });
});

// Test error handling patterns
describe('Error Handling Patterns', () => {
  const errorApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      if (req.query.error === 'throw') {
        throw new Error('Simulated error');
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: (error as Error).message,
      });
    }
  };

  it('should handle thrown errors gracefully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { error: 'throw' },
    });

    await errorApiHandler(req, res);

    expect(res._getStatusCode()).toBe(500);

    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('Internal server error');
    expect(responseData.message).toBe('Simulated error');
  });

  it('should return success when no error', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {},
    });

    await errorApiHandler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
  });
});
