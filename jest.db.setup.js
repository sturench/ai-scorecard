// Database integration test setup - uses REAL Prisma client
// This is used specifically for database tests in tests/db/

// Mock only external services, not the database we're testing
jest.mock('@hubspot/api-client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    crm: {
      contacts: {
        basicApi: {
          create: jest.fn().mockResolvedValue({ id: '12345' }),
          update: jest.fn().mockResolvedValue({ id: '12345' }),
          getById: jest.fn().mockResolvedValue({ id: '12345' }),
        },
      },
      deals: {
        basicApi: {
          create: jest.fn().mockResolvedValue({ id: '67890' }),
          update: jest.fn().mockResolvedValue({ id: '67890' }),
          getById: jest.fn().mockResolvedValue({ id: '67890' }),
        },
      },
    },
  })),
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id', data: null, error: null }),
    },
  })),
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

// Console setup
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('❌ Error cleaning up test database'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
