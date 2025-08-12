# API Specification - AI Reality Check Scorecard

## Overview

RESTful API design with session-based authentication for the AI Reality Check Scorecard assessment tool. No user registration required - sessions are created automatically and managed via secure HTTP-only cookies.

## Authentication & Security

### Session Management
- **Session Creation:** Automatic on first API call
- **Session Storage:** Secure HTTP-only cookies
- **Session Duration:** 24 hours with activity extension
- **CSRF Protection:** Built-in with Next.js middleware
- **Rate Limiting:** 10 assessments per hour per IP address

### Security Headers
All responses include these security headers:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## Base URL
```
Production: https://aireadycheck.com/api
Development: http://localhost:3000/api
```

## API Endpoints

### 1. Start Assessment

**Endpoint:** `POST /api/assessment/start`

**Purpose:** Initialize a new assessment session with optional email capture

**Request:**
```typescript
interface StartAssessmentRequest {
  email?: string;           // Optional email for follow-up
  company?: string;         // Optional company name
  referrer?: string;        // Where user came from
  browserInfo?: {
    userAgent: string;
    viewport: { width: number; height: number; };
  };
}
```

**Response:**
```typescript
interface StartAssessmentResponse {
  sessionId: string;        // Session identifier
  assessmentId: string;     // Assessment record ID
  currentStep: number;      // Always 0 for new assessment
  totalSteps: number;       // Always 4
  expiresAt: string;        // ISO timestamp (24 hours from now)
  resumeUrl: string;        // URL to resume assessment
}
```

**Example Request:**
```bash
curl -X POST /api/assessment/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@company.com",
    "company": "Acme Corp",
    "referrer": "https://google.com/search",
    "browserInfo": {
      "userAgent": "Mozilla/5.0...",
      "viewport": { "width": 1920, "height": 1080 }
    }
  }'
```

**Example Response:**
```json
{
  "sessionId": "sess_abc123def456",
  "assessmentId": "assess_789xyz012",
  "currentStep": 0,
  "totalSteps": 4,
  "expiresAt": "2025-08-13T10:30:00Z",
  "resumeUrl": "/assessment/step/1"
}
```

**Status Codes:**
- `200`: Assessment started successfully
- `400`: Invalid request data
- `429`: Rate limit exceeded (10 per hour)
- `500`: Server error

---

### 2. Save Progress

**Endpoint:** `POST /api/assessment/save-progress`

**Purpose:** Save current step responses and update session state

**Request:**
```typescript
interface SaveProgressRequest {
  step: number;             // Current step (0-3, 0-indexed)
  responses: {              // Answers for current step
    [questionId: string]: string; // Question ID -> Answer choice (A, B, C, D, E)
  };
  email?: string;           // Optional email if captured on this step
  timeSpent?: number;       // Seconds spent on this step
}
```

**Response:**
```typescript
interface SaveProgressResponse {
  saved: boolean;           // Always true if successful
  currentStep: number;      // Updated current step
  nextStep: number | null;  // Next step number or null if complete
  canProceed: boolean;      // Whether all required questions answered
  progress: {
    completed: number;      // Steps completed
    total: number;          // Total steps
    percentage: number;     // Completion percentage
  };
  validationErrors?: string[];
}
```

**Example Request:**
```bash
curl -X POST /api/assessment/save-progress \
  -H "Content-Type: application/json" \
  -H "Cookie: assessment-session=sess_abc123def456" \
  -d '{
    "step": 0,
    "responses": {
      "value_assurance_1": "A",
      "value_assurance_2": "B", 
      "value_assurance_3": "C",
      "value_assurance_4": "A"
    },
    "email": "ceo@company.com",
    "timeSpent": 45
  }'
```

**Example Response:**
```json
{
  "saved": true,
  "currentStep": 1,
  "nextStep": 1,
  "canProceed": true,
  "progress": {
    "completed": 1,
    "total": 4,
    "percentage": 25
  }
}
```

**Status Codes:**
- `200`: Progress saved successfully
- `400`: Invalid step or responses data
- `401`: Invalid or expired session
- `404`: Assessment not found
- `422`: Validation errors (incomplete responses)
- `500`: Server error

---

### 3. Submit Assessment

**Endpoint:** `POST /api/assessment/submit`

**Purpose:** Complete assessment, calculate scores, and trigger HubSpot sync

**Request:**
```typescript
interface SubmitAssessmentRequest {
  finalResponses?: {        // Any final answer changes
    [questionId: string]: string;
  };
  completionTime: number;   // Total time in seconds
  contactInfo?: {           // Progressive data capture
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
  };
  feedback?: string;        // Optional user feedback
}
```

**Response:**
```typescript
interface SubmitAssessmentResponse {
  assessmentId: string;
  completed: boolean;       // Always true if successful
  totalScore: number;       // 0-100 overall score
  scoreBreakdown: {
    valueAssurance: number; // 0-100, weighted 25%
    customerSafe: number;   // 0-100, weighted 35%
    riskCompliance: number; // 0-100, weighted 25%
    governance: number;     // 0-100, weighted 15%
  };
  scoreCategory: string;    // 'champion' | 'builder' | 'risk_zone' | 'alert' | 'crisis'
  categoryDescription: string;
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
  }>;
  resultsUrl: string;       // URL to view detailed results
  hubspotSyncStatus: 'synced' | 'pending' | 'failed' | 'skipped';
  emailDeliveryStatus: 'sent' | 'pending' | 'failed' | 'skipped';
  qualifiedForBriefing: boolean;
}
```

**Example Request:**
```bash
curl -X POST /api/assessment/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: assessment-session=sess_abc123def456" \
  -d '{
    "completionTime": 480,
    "contactInfo": {
      "firstName": "John",
      "lastName": "Doe", 
      "company": "Acme Corp",
      "phone": "+1-555-123-4567"
    },
    "feedback": "Very helpful assessment"
  }'
```

**Example Response:**
```json
{
  "assessmentId": "assess_789xyz012",
  "completed": true,
  "totalScore": 67,
  "scoreBreakdown": {
    "valueAssurance": 75,
    "customerSafe": 80,
    "riskCompliance": 60,
    "governance": 55
  },
  "scoreCategory": "builder",
  "categoryDescription": "Good foundation in place with specific areas for improvement",
  "recommendations": [
    {
      "category": "governance",
      "priority": "high",
      "title": "Implement Version Control for AI Models",
      "description": "Establish proper versioning and rollback procedures for AI deployments",
      "actionItems": [
        "Set up model versioning system",
        "Define rollback procedures",
        "Create staging environment"
      ]
    }
  ],
  "resultsUrl": "/assessment/results/assess_789xyz012",
  "hubspotSyncStatus": "pending",
  "emailDeliveryStatus": "sent", 
  "qualifiedForBriefing": true
}
```

**Status Codes:**
- `200`: Assessment completed successfully
- `400`: Assessment incomplete or invalid data
- `401`: Invalid or expired session
- `404`: Assessment not found
- `422`: Validation errors
- `500`: Server error

---

### 4. Get Results

**Endpoint:** `GET /api/assessment/results/{assessmentId}`

**Purpose:** Retrieve detailed assessment results and recommendations

**Parameters:**
- `assessmentId`: UUID of completed assessment

**Response:**
```typescript
interface AssessmentResultsResponse {
  assessmentId: string;
  completedAt: string;      // ISO timestamp
  totalScore: number;
  scoreBreakdown: {
    valueAssurance: {
      score: number;          // 0-100
      weight: number;         // 0.25
      questions: Array<{
        id: string;           // Question identifier
        question: string;     // Question text
        answer: string;       // Selected answer
        answerText: string;   // Full answer text
        points: number;       // Points earned (0-25)
        maxPoints: number;    // Maximum possible (25)
      }>;
    };
    customerSafe: { /* same structure, weight: 0.35 */ };
    riskCompliance: { /* same structure, weight: 0.25 */ };
    governance: { /* same structure, weight: 0.15 */ };
  };
  scoreCategory: string;
  categoryDescription: string;
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
    estimatedImpact: string;  // Expected improvement
    timeToImplement: string;  // Implementation timeline
  }>;
  benchmarks: {
    industryAverage?: number;
    percentile?: number;
    similarCompanies?: number;
  };
  nextSteps: {
    briefingCta?: {
      title: string;
      description: string;
      buttonText: string;
      url: string;
    };
    resources: Array<{
      title: string;
      description: string;
      url: string;
      type: 'guide' | 'template' | 'checklist';
    }>;
  };
}
```

**Example Request:**
```bash
curl -X GET /api/assessment/results/assess_789xyz012 \
  -H "Cookie: assessment-session=sess_abc123def456"
```

**Status Codes:**
- `200`: Results retrieved successfully
- `401`: Invalid session (for accessing own results)
- `404`: Assessment not found or not completed
- `403`: Access denied (trying to access others' results)
- `500`: Server error

---

### 5. Resume Assessment

**Endpoint:** `GET /api/assessment/resume`

**Purpose:** Get current assessment state for resuming incomplete assessment

**Response:**
```typescript
interface ResumeAssessmentResponse {
  hasActiveAssessment: boolean;
  assessment?: {
    assessmentId: string;
    currentStep: number;      // 0-based step index
    totalSteps: number;       // Always 4
    responses: {              // Previously saved responses
      [questionId: string]: string;
    };
    email?: string;           // If previously provided
    contactInfo?: {           // If previously provided
      firstName?: string;
      lastName?: string;
      company?: string;
      phone?: string;
    };
    progress: {
      completed: number;      // Steps completed
      percentage: number;     // Completion percentage
    };
    startedAt: string;        // ISO timestamp
    timeElapsed: number;      // Seconds since start
    timeRemaining: number;    // Seconds until expiry
    resumeUrl: string;        // URL to continue
  };
}
```

**Example Response:**
```json
{
  "hasActiveAssessment": true,
  "assessment": {
    "assessmentId": "assess_789xyz012",
    "currentStep": 2,
    "totalSteps": 4,
    "responses": {
      "value_assurance_1": "A",
      "value_assurance_2": "B",
      "customer_safe_1": "C"
    },
    "email": "ceo@company.com",
    "progress": {
      "completed": 2,
      "percentage": 50
    },
    "startedAt": "2025-08-12T10:00:00Z",
    "timeElapsed": 300,
    "timeRemaining": 86100,
    "resumeUrl": "/assessment/step/3"
  }
}
```

**Status Codes:**
- `200`: Session state retrieved (even if no active assessment)
- `401`: Invalid session
- `500`: Server error

---

### 6. Health Check

**Endpoint:** `GET /api/health`

**Purpose:** API status and dependency checks

**Response:**
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;        // ISO timestamp
  version: string;          // API version
  uptime: number;           // Server uptime in seconds
  services: {
    database: 'up' | 'down' | 'slow';
    hubspot: 'up' | 'down' | 'rate_limited';
    email: 'up' | 'down' | 'degraded';
    redis?: 'up' | 'down';  // If using Redis for rate limiting
  };
  performance: {
    avgResponseTime: number; // Average API response time (ms)
    requestsPerMinute: number;
    errorRate: number;       // Error rate percentage
  };
}
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-12T15:30:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "database": "up",
    "hubspot": "up",
    "email": "up"
  },
  "performance": {
    "avgResponseTime": 150,
    "requestsPerMinute": 45,
    "errorRate": 0.02
  }
}
```

**Status Codes:**
- `200`: System healthy or degraded
- `503`: System unhealthy

## Error Handling

### Standard Error Response
```typescript
interface APIError {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: any;          // Additional context
    timestamp: string;      // ISO timestamp
    requestId: string;      // For support/debugging
    retryAfter?: number;    // Seconds before retry (for rate limits)
  };
}
```

### Error Codes
| Code | Description | Status | Retryable |
|------|-------------|--------|-----------|
| `RATE_LIMIT_EXCEEDED` | Too many requests from IP | 429 | Yes |
| `SESSION_EXPIRED` | Session expired or invalid | 401 | No |
| `ASSESSMENT_NOT_FOUND` | Assessment ID doesn't exist | 404 | No |
| `ASSESSMENT_INCOMPLETE` | Trying to submit incomplete assessment | 400 | No |
| `VALIDATION_ERROR` | Request data validation failed | 422 | No |
| `HUBSPOT_SYNC_FAILED` | HubSpot integration error | 200* | N/A |
| `EMAIL_DELIVERY_FAILED` | Email service error | 200* | N/A |
| `DATABASE_ERROR` | Database operation failed | 500 | Yes |
| `SERVICE_UNAVAILABLE` | System temporarily unavailable | 503 | Yes |

*Non-critical errors return 200 with warning/info in response

### Example Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid responses format",
    "details": {
      "field": "responses.value_assurance_1",
      "reason": "Answer choice 'X' is not valid",
      "validChoices": ["A", "B", "C", "D", "E"]
    },
    "timestamp": "2025-08-12T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

## Rate Limiting

### Limits by Endpoint
| Endpoint | Limit | Window | Scope |
|----------|-------|---------|--------|
| `/assessment/start` | 10 | 1 hour | Per IP |
| `/assessment/save-progress` | 100 | 1 hour | Per session |
| `/assessment/submit` | 5 | 1 hour | Per IP |
| `/assessment/results/*` | 50 | 1 hour | Per IP |
| `/assessment/resume` | 20 | 1 hour | Per IP |
| `/health` | 100 | 1 minute | Per IP |

### Rate Limit Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1691836800
X-RateLimit-RetryAfter: 3600
```

## Session Management

### Cookie Configuration
```typescript
{
  name: 'assessment-session',
  httpOnly: true,
  secure: true,      // HTTPS only in production
  sameSite: 'lax',   // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? 'aireadycheck.com' : undefined
}
```

### Session Data
```typescript
interface SessionData {
  sessionId: string;
  assessmentId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}
```

## HubSpot Integration

### Sync Triggers
1. **Immediate:** When assessment submitted with email
2. **Queued:** Failed syncs with exponential backoff retry
3. **Manual:** Admin dashboard can trigger resync

### Sync Payload Format
```typescript
interface HubSpotSyncPayload {
  email: string;
  properties: {
    // Standard properties
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    
    // Custom properties (max 10 on free tier)
    ai_assessment_score: number;          // Overall score 0-100
    ai_assessment_category: string;       // Score category
    ai_value_score: number;               // Value Assurance score
    ai_customer_score: number;            // Customer-Safe AI score
    ai_risk_score: number;                // Risk & Compliance score  
    ai_governance_score: number;          // Implementation Governance score
    ai_assessment_date: string;           // YYYY-MM-DD format
    ai_completion_time: number;           // Seconds to complete
    ai_lead_quality: string;              // 'basic' | 'enhanced' | 'executive_briefing_qualified'
    lead_source: 'AI Reality Check Scorecard';
  };
}
```

### Deal Creation (Executive Briefing Qualified)
```typescript
interface HubSpotDealPayload {
  properties: {
    dealname: string;                     // "AI Reality Check - John Doe (Acme Corp)"
    dealstage: 'executive_briefing_requested';
    amount: '5000';                       // Estimated consulting value
    pipeline: 'ai_consulting_pipeline';
    closedate: string;                    // 30 days from now
    ai_assessment_score: number;          // Link to assessment
  };
  associations: [{
    to: { id: string };                   // Contact ID
    types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
  }];
}
```

## Testing Endpoints

### Test Data Generation
For development and testing, these endpoints provide sample data:

**GET /api/test/sample-assessment** (development only)
Returns sample assessment data for UI testing.

**POST /api/test/simulate-hubspot-failure** (development only)
Simulates HubSpot API failure for error handling testing.

**GET /api/test/clear-session** (development only) 
Clears current session for testing fresh assessment flow.

## Implementation Examples

### Frontend API Client
```typescript
class AssessmentAPIClient {
  private baseURL = '/api';
  
  async startAssessment(data: StartAssessmentRequest): Promise<StartAssessmentResponse> {
    const response = await fetch(`${this.baseURL}/assessment/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', // Include session cookie
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.error);
    }
    
    return response.json();
  }
  
  async saveProgress(data: SaveProgressRequest): Promise<SaveProgressResponse> {
    const response = await fetch(`${this.baseURL}/assessment/save-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }
  
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.error);
    }
    return response.json();
  }
}

class APIError extends Error {
  constructor(public errorData: any) {
    super(errorData.message);
    this.name = 'APIError';
  }
}
```

### Server-Side Implementation Pattern
```typescript
// app/api/assessment/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { startAssessmentSchema } from '@/lib/validation';
import { createSession, createAssessment } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validData = startAssessmentSchema.parse(body);
    
    // Create session and assessment
    const session = await createSession(request);
    const assessment = await createAssessment(validData, session);
    
    const response = NextResponse.json({
      sessionId: session.id,
      assessmentId: assessment.id,
      currentStep: 0,
      totalSteps: 4,
      expiresAt: session.expiresAt.toISOString(),
      resumeUrl: `/assessment/step/1`
    });
    
    // Set session cookie
    response.cookies.set('assessment-session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return response;
    
  } catch (error) {
    return handleAPIError(error);
  }
}
```

This API specification provides a complete contract for frontend-backend communication with all necessary details for implementation, testing, and integration with external services.