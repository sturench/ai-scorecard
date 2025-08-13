# Testing Infrastructure Documentation

This document explains how to use the comprehensive testing infrastructure for the AI Reality Check Scorecard project.

## Overview

The testing infrastructure is designed to support **Test-Driven Development (TDD)** with comprehensive coverage, realistic mocking, and multiple testing patterns.

## Architecture

### Testing Stack

- **Jest** - Test runner with Next.js integration
- **React Testing Library** - Component testing utilities
- **Supertest** - API route testing
- **MSW** - Mock Service Worker for API mocking
- **Faker.js** - Test data generation
- **Node Mocks HTTP** - HTTP request/response mocking

### Directory Structure

```
tests/
├── api/                    # API route tests
├── components/            # React component tests
├── integration/           # End-to-end integration tests
├── mocks/                # Mock implementations
│   ├── hubspot.ts        # HubSpot API mocks
│   └── email.ts          # Email service mocks
├── utils/                # Testing utilities
│   ├── test-helpers.ts   # Test data factories
│   └── db-helpers.ts     # Database testing utilities
├── fixtures/             # Fixed test data
│   └── assessment-data.ts # Assessment scenarios
└── README.md            # This documentation
```

## Testing Patterns

### 1. Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('button handles clicks', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 2. API Route Testing

```typescript
import { createMocks } from 'node-mocks-http';
import { mockHubSpotClient } from '../mocks/hubspot';

test('API creates contact', async () => {
  const { req, res } = createMocks({
    method: 'POST',
    body: { contactInfo: testContact },
  });

  await apiHandler(req, res);
  expect(res._getStatusCode()).toBe(200);
});
```

### 3. Integration Testing

```typescript
import { getTestDb, cleanupTestDb } from '../utils/db-helpers';

test('complete assessment flow', async () => {
  const db = getTestDb();
  // Test with real database operations
});
```

## Test Data Management

### Mock Data Factories

Use `test-helpers.ts` for generating realistic test data:

```typescript
import { createMockAssessment, createMockContactInfo } from '../utils/test-helpers';

const assessment = createMockAssessment({
  scoreCategory: 'leader',
  totalScore: 78,
});
```

### Fixed Fixtures

Use `assessment-data.ts` for consistent test scenarios:

```typescript
import { assessmentResponseFixtures, expectedScoreFixtures } from '../fixtures/assessment-data';

const pioneerResponses = assessmentResponseFixtures.pioneer;
const expectedScore = expectedScoreFixtures.pioneer.totalScore; // 92
```

### Mock Services

Realistic external service mocking:

```typescript
import { mockHubSpotClient, mockEmailService } from '../mocks';

beforeEach(() => {
  mockHubSpotClient.reset();
  mockEmailService.reset();
});

test('handles HubSpot rate limiting', () => {
  mockHubSpotClient.simulateRateLimit('createContact');
  // Test rate limit handling
});
```

## Running Tests

### Development (TDD Mode)

```bash
npm test                    # Watch mode for TDD
npm run test:components     # Component tests only
npm run test:api           # API tests only
npm run test:db            # Database tests only
```

### Continuous Integration

```bash
npm run test:ci            # Full test suite with coverage
npm run test:coverage      # Coverage report
```

### Integration Testing

```bash
npm run test:integration   # Integration tests with real DB
```

## Test Database Setup

### Environment Configuration

Create `.env.test` with test database URL:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_scorecard_test"
```

### Database Scripts

```bash
npm run db:push:test       # Push schema to test DB
npm run db:reset:test      # Reset test database
npm run db:seed:test       # Seed test data
```

### Integration Test Pattern

```typescript
import { getTestDb, cleanupTestDb, disconnectTestDb } from '../utils/db-helpers';

describe('Assessment API Integration', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('creates assessment with real database', async () => {
    const db = getTestDb();
    // Real database operations
  });
});
```

## Coverage Requirements

### Thresholds

- **80% minimum** for all metrics:
  - Branch coverage
  - Function coverage
  - Line coverage
  - Statement coverage

### Coverage Reports

```bash
npm run test:coverage      # Generate HTML report in coverage/
```

### Quality Gates

- All tests must pass before commit
- Coverage thresholds enforced
- Performance tests for critical paths

## Mock Strategy

### What to Mock

✅ **External APIs** (HubSpot, Email services)  
✅ **Browser APIs** (localStorage, fetch, timers)  
✅ **Third-party libraries** (Framer Motion, etc.)

### What NOT to Mock

❌ **Business logic** (scoring algorithms)  
❌ **Prisma operations** (use test database)  
❌ **Internal modules** (use real implementations)  
❌ **React components** (test real rendering)

## TDD Workflow

### Red-Green-Refactor Cycle

1. **Red** - Write failing test first

```typescript
test('calculates assessment score correctly', () => {
  const responses = assessmentResponseFixtures.leader;
  const score = calculateScore(responses);
  expect(score.total).toBe(78); // This will fail initially
});
```

2. **Green** - Write minimal implementation

```typescript
export function calculateScore(responses: any) {
  return { total: 78 }; // Hardcoded to pass
}
```

3. **Refactor** - Improve implementation

```typescript
export function calculateScore(responses: AssessmentResponses) {
  // Real scoring logic with proper calculation
  return calculateWeightedScore(responses);
}
```

## Best Practices

### Test Naming

```typescript
describe('AssessmentScoring', () => {
  describe('calculateScore', () => {
    it('should return 90+ for pioneer responses', () => {
      // Test implementation
    });

    it('should handle missing responses gracefully', () => {
      // Error case testing
    });
  });
});
```

### Async Testing

```typescript
test('handles async operations', async () => {
  const promise = asyncOperation();
  await expect(promise).resolves.toBe(expectedValue);
});

test('handles timeout errors', async () => {
  await expect(operationWithTimeout(50)).rejects.toThrow('Timeout');
});
```

### Error Scenarios

```typescript
test('handles validation errors', () => {
  expect(() => {
    validateEmail('invalid-email');
  }).toThrow('Invalid email format');
});

test('handles API errors gracefully', async () => {
  mockHubSpotClient.simulateError('createContact', new Error('API Error'));

  const result = await createContact(contactData);
  expect(result.error).toBe('Failed to create contact');
});
```

## Performance Testing

### Critical Path Benchmarks

```typescript
test('assessment completion under 10 seconds', async () => {
  const startTime = Date.now();

  await completeAssessmentFlow(testData);

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(10000);
});
```

## Debugging Tests

### Common Issues

1. **Tests timing out** - Increase timeout or fix async handling
2. **Mock not working** - Verify mock is imported before usage
3. **Database conflicts** - Ensure proper cleanup between tests
4. **Coverage missing** - Check file paths in collectCoverageFrom

### Debug Commands

```bash
npm test -- --verbose              # Detailed output
npm test -- --detectOpenHandles    # Find resource leaks
npm test -- --forceExit           # Force exit on completion
```

## Contributing

### Adding New Tests

1. Follow existing patterns in `tests/` directories
2. Use appropriate mocks from `tests/mocks/`
3. Include both success and error scenarios
4. Maintain 80%+ coverage requirement
5. Update documentation for new patterns

### Test Reviews

- Verify tests actually test the intended behavior
- Ensure mocks don't hide real bugs
- Check edge cases are covered
- Validate performance implications

---

This testing infrastructure enables confident development with comprehensive test coverage while maintaining realistic test scenarios through proper mocking strategies.
