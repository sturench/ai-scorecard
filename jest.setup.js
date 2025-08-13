// Jest DOM setup for testing React components
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    reload: jest.fn(),
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    basePath: '',
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
  }),
}));

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_NAME = 'AI Reality Check Scorecard';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/ai_scorecard_test';

// Mock Prisma client for testing
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    assessment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    assessmentSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    hubspotSyncQueue: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  })),
}));

// Mock HubSpot API client
jest.mock('@hubspot/api-client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    crm: {
      contacts: {
        basicApi: {
          create: jest.fn(),
          update: jest.fn(),
          getById: jest.fn(),
        },
      },
      deals: {
        basicApi: {
          create: jest.fn(),
          update: jest.fn(),
          getById: jest.fn(),
        },
      },
    },
  })),
}));

// Mock Resend email client
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id', data: null, error: null }),
    },
  })),
}));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock Upstash Redis (if using rate limiting)
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: {
    slidingWindow: jest.fn(),
  },
}));

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    })),
  },
}));

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Custom render function that includes providers
import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/theme-provider';

function render(ui, { ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return (
      <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override the default render method
export { render };

// Global test utilities
global.renderWithProviders = render;

// Suppress console warnings during tests (optional)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('componentWillReceiveProps')) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
