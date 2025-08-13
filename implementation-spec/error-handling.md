# AI Reality Check Scorecard - Error Handling Specification

## Overview

Pragmatic error handling strategy that prioritizes development speed for MVP while maintaining a clear upgrade path to enhanced user communication. Focus on critical errors only, with silent retry for non-critical failures.

## Philosophy

- **MVP Goal**: Minimize complexity, ship fast
- **Background resilience**: Retry logic handles most failures invisibly
- **Critical errors only**: Handle session expiry and validation failures
- **Upgrade path preserved**: Easy transition to graceful degradation later

## Error Classification

### Critical Errors (Must Handle Immediately)

**Impact**: Block user progress or cause data loss
**Strategy**: Immediate user notification with clear next steps

1. **Session Expiry**
2. **Database Connection Failures**
3. **Invalid Assessment Data**
4. **Rate Limit Exceeded**

### Non-Critical Errors (Silent Retry for MVP)

**Impact**: Background processes, don't block user flow
**Strategy**: Log, queue for retry, show success to user

1. **HubSpot API Failures**
2. **Email Delivery Failures**
3. **Analytics Tracking Failures**
4. **Non-essential API Calls**

## MVP Implementation Strategy

### Critical Error Handling

#### Session Expiry

```typescript
// Middleware check on all API calls
export function withSessionValidation(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req);

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please start a new assessment.',
          action: 'restart_assessment',
        },
      });
    }

    return handler(req, res);
  };
}
```

**Frontend Handling**:

```typescript
// Global error handler
if (error.code === 'SESSION_EXPIRED') {
  showMessage('Your session expired. Redirecting to start...', 'warning');
  setTimeout(() => router.push('/'), 2000);
}
```

#### Database Connection Failures

```typescript
// Simple retry with user feedback
async function saveAssessmentProgress(data: any) {
  try {
    return await db.assessment.upsert(data);
  } catch (error) {
    if (isConnectionError(error)) {
      // Critical: Can't save progress
      throw new Error('Unable to save your progress. Please try again.');
    }
    throw error;
  }
}
```

#### Validation Errors

```typescript
// Clear validation feedback
export function validateAssessmentData(responses: any) {
  const errors: string[] = [];

  // Check required responses
  if (!responses || Object.keys(responses).length === 0) {
    errors.push('Please answer at least one question to continue');
  }

  // Validate answer formats
  Object.entries(responses).forEach(([key, value]) => {
    if (!isValidAnswerChoice(value)) {
      errors.push(`Invalid answer for ${key}`);
    }
  });

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}
```

### Non-Critical Error Handling (Silent Retry)

#### HubSpot Integration

```typescript
// MVP: Log and retry, don't block user
async function syncToHubSpot(assessmentData: any) {
  try {
    const result = await hubspotClient.crm.contacts.create(assessmentData);
    logger.info('HubSpot sync successful', { contactId: result.id });
    return result;
  } catch (error) {
    // Log error but don't throw - user doesn't need to know
    logger.error('HubSpot sync failed', {
      error: error.message,
      assessmentId: assessmentData.assessmentId,
    });

    // Queue for background retry
    await retryQueue.add('hubspot-sync', assessmentData, {
      attempts: 5,
      backoff: 'exponential',
      delay: 60000, // 1 minute initial delay
    });

    // Return success to user (they don't need to know about sync issues)
    return { queued: true };
  }
}
```

#### Email Delivery

```typescript
// MVP: Silent failure with retry
async function sendResultsEmail(email: string, results: any) {
  try {
    await emailService.send({
      to: email,
      template: 'assessment-results',
      data: results,
    });
    logger.info('Results email sent', { email });
  } catch (error) {
    // Log but don't block results display
    logger.error('Email delivery failed', { email, error: error.message });

    // Queue for retry
    await retryQueue.add(
      'send-email',
      { email, results },
      {
        attempts: 3,
        backoff: 'fixed',
        delay: 300000, // 5 minutes
      }
    );
  }

  // Always return success - user sees results regardless
  return { sent: true };
}
```

## Error Response Standards

### Critical Error Response Format

```typescript
interface CriticalErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // User-friendly message
    action?: string; // Suggested user action
    retryable: boolean; // Can user retry?
    timestamp: string; // ISO timestamp
  };
}
```

### Critical Error Codes

- `SESSION_EXPIRED`: User session has expired
- `VALIDATION_ERROR`: Invalid input data
- `DATABASE_ERROR`: Critical database failure
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: System temporarily down

### User-Friendly Error Messages

```typescript
const ERROR_MESSAGES = {
  SESSION_EXPIRED: "Your session has expired. We'll start you fresh.",
  VALIDATION_ERROR: 'Please check your answers and try again.',
  DATABASE_ERROR: "We're having trouble saving your progress. Please try again.",
  RATE_LIMIT_EXCEEDED: 'Please wait a moment before continuing.',
  SERVICE_UNAVAILABLE: 'Our system is temporarily unavailable. Please try again in a few minutes.',
};
```

## Background Retry System

### Retry Queue Configuration

```typescript
// Using Bull Queue (Redis-based)
const retryQueue = new Queue('background-retries', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 successful jobs
    removeOnFail: 50, // Keep last 50 failed jobs
  },
});

// Job processors
retryQueue.process('hubspot-sync', async (job) => {
  const { data } = job;
  return await hubspotClient.crm.contacts.create(data);
});

retryQueue.process('send-email', async (job) => {
  const { email, results } = job.data;
  return await emailService.send({
    to: email,
    template: 'assessment-results',
    data: results,
  });
});
```

### Exponential Backoff Strategy

```typescript
const RETRY_DELAYS = {
  'hubspot-sync': [1, 5, 15, 60, 300], // minutes
  'send-email': [5, 15, 60], // minutes
  analytics: [1, 5], // minutes - less critical
};
```

## Frontend Error Handling

### Global Error Boundary (React)

```typescript
class AssessmentErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log to monitoring service
    logger.error('React error boundary caught', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>Please refresh the page and try again.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Call Error Handling

```typescript
// Simple fetch wrapper with critical error handling only
async function apiCall(endpoint: string, options: any = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Handle critical errors only
      if (CRITICAL_ERROR_CODES.includes(errorData.error?.code)) {
        throw new CriticalError(errorData.error);
      }

      // Log non-critical errors but don't throw
      logger.warn('API call failed (non-critical)', {
        endpoint,
        status: response.status,
        error: errorData,
      });

      // Return success for non-critical failures
      return { success: true, data: null };
    }

    return await response.json();
  } catch (error) {
    if (error instanceof CriticalError) {
      throw error;
    }

    // Network errors - treat as critical for now
    throw new CriticalError({
      code: 'NETWORK_ERROR',
      message: 'Connection problem. Please check your internet and try again.',
    });
  }
}

const CRITICAL_ERROR_CODES = [
  'SESSION_EXPIRED',
  'VALIDATION_ERROR',
  'RATE_LIMIT_EXCEEDED',
  'SERVICE_UNAVAILABLE',
];
```

## Logging Strategy

### Structured Logging

```typescript
// Using Winston or similar
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'ai-scorecard' },
});

// Error logging with context
function logError(operation: string, error: any, context: any = {}) {
  logger.error(`${operation} failed`, {
    error: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  });
}
```

### Key Events to Log

```typescript
// Success events (info level)
logger.info('Assessment started', { sessionId, userAgent });
logger.info('Assessment completed', { assessmentId, score, completionTime });
logger.info('HubSpot sync successful', { contactId });

// Error events (error level)
logger.error('HubSpot sync failed', { assessmentId, error });
logger.error('Email delivery failed', { email, error });
logger.error('Database operation failed', { operation, error });

// Warning events (warn level)
logger.warn('Session expired', { sessionId, lastActivity });
logger.warn('Retry queue full', { queueSize });
```

## Environment-Specific Behavior

### Development

- Show detailed error messages
- Log everything to console
- No retry queues (fail fast)

### Production

- User-friendly messages only
- Structured logging to files/service
- Full retry queue implementation
- Error monitoring enabled

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

function handleError(error: any, context: string) {
  if (isDevelopment) {
    console.error(`[${context}]`, error);
    throw error; // Fail fast in dev
  } else {
    logger.error(context, error);
    // Return graceful response in prod
    return { success: true };
  }
}
```

## Upgrade Path to Enhanced Error Handling

### Phase 2: Graceful Degradation (Future)

When ready to improve UX, simply modify the catch blocks:

```typescript
// Current MVP approach
} catch (error) {
  logger.error('HubSpot sync failed', error);
  retryQueue.add(data);
  return { success: true }; // Silent success
}

// Phase 2 upgrade
} catch (error) {
  logger.error('HubSpot sync failed', error);
  retryQueue.add(data);

  // Add graceful messaging
  return {
    success: true,
    message: "Results saved! We're sending your detailed report now..."
  };
}
```

## Testing Strategy

### Error Scenario Tests

```typescript
// Test critical error handling
describe('Critical Error Handling', () => {
  it('should redirect on session expiry', async () => {
    mockSessionExpired();
    const response = await saveProgress(validData);
    expect(response.error.code).toBe('SESSION_EXPIRED');
  });

  it('should validate assessment responses', async () => {
    const invalidData = { responses: {} };
    expect(() => validateAssessmentData(invalidData)).toThrow(
      'Please answer at least one question'
    );
  });
});

// Test non-critical error resilience
describe('Non-Critical Error Resilience', () => {
  it('should queue failed HubSpot syncs', async () => {
    mockHubSpotFailure();
    const result = await syncToHubSpot(assessmentData);
    expect(result.queued).toBe(true);
    expect(retryQueue.add).toHaveBeenCalled();
  });
});
```

## Implementation Priority

### Week 1 (MVP Critical Errors Only)

1. Session expiry handling
2. Basic validation errors
3. Database connection failures
4. Simple logging setup

### Week 2 (Background Resilience)

1. HubSpot retry queue
2. Email delivery retry
3. Structured logging
4. Basic monitoring

### Future (Enhanced UX)

1. Graceful error messages
2. Real-time status updates
3. Advanced monitoring
4. Error analytics

---

## Key Benefits of This Approach

### Development Speed

- **80% less error handling code** in MVP
- Focus on happy path implementation
- Quick time to market

### User Experience

- Smooth assessment flow (critical errors handled)
- No technical error exposure
- Background reliability (retries handle issues)

### Scalability

- Clear upgrade path to better UX
- Retry system handles load spikes
- Comprehensive logging for debugging

### Maintainability

- Simple codebase initially
- Easy to enhance incrementally
- Monitoring foundation in place

---

_Last Updated: 2025-08-12_  
_Status: MVP approach defined with clear upgrade path_
