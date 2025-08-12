# Technical Architecture - AI Reality Check Scorecard

## Technology Stack

### Frontend Architecture
**Framework:** Next.js 14.2.x with App Router
- React 18.3.x for component architecture
- TypeScript 5.5.x for type safety
- Tailwind CSS 3.4.x for styling with CSS custom properties
- Framer Motion 11.x for animations
- React Hook Form 7.52.x for form management
- Zod 3.23.x for validation
- next-themes 0.3.x for theme switching

**State Management:** React Context + useReducer
- Assessment flow state with localStorage persistence
- Form state via React Hook Form
- Theme state via next-themes
- No Redux needed for this application

### Backend Architecture
**API Design:** Next.js API Routes (App Router)
- Node.js 20.x runtime (Vercel Edge where applicable)
- RESTful API patterns
- Zod schemas for request/response validation
- Upstash Redis for rate limiting (optional for MVP)
- Custom session handling for assessment persistence

### Database Strategy
**Primary Database:** PostgreSQL (Supabase or Neon recommended)
- Simple schema with assessments table as core entity
- HubSpot as single source of truth for user data
- 30-day email retention with automatic PII scrubbing
- Anonymous long-term analytics capability
- Session storage for incomplete assessments
- Failed sync queue for HubSpot resilience
- Prisma ORM for type-safe operations

## Component Hierarchy

### Next.js App Structure
```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                  # Landing page (static)
├── globals.css              # Global styles and CSS variables
├── assessment/
│   ├── layout.tsx           # Assessment flow wrapper
│   ├── start/page.tsx       # Email capture (optional)
│   ├── step/
│   │   ├── [step]/page.tsx  # Dynamic step pages (1-4)
│   │   └── components/
│   │       ├── Question.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── Navigation.tsx
│   │       └── EmailCapture.tsx
│   └── results/page.tsx     # Results display and progressive capture
├── api/
│   ├── assessment/
│   │   ├── start/route.ts
│   │   ├── save-progress/route.ts
│   │   ├── submit/route.ts
│   │   └── results/[id]/route.ts
│   ├── hubspot/
│   │   ├── contact/route.ts
│   │   └── deal/route.ts
│   ├── email/
│   │   └── send/route.ts
│   └── health/route.ts
└── components/
    ├── ui/                  # Reusable UI components
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── Card.tsx
    │   └── LoadingSpinner.tsx
    ├── theme/
    │   └── ThemeProvider.tsx
    ├── assessment/
    │   ├── ScoreGauge.tsx
    │   ├── RecommendationCard.tsx
    │   └── ProgressIndicator.tsx
    └── layout/
        ├── Header.tsx
        └── Footer.tsx
```

## Implementation Patterns

### Theming System
```css
/* CSS Custom Properties for dynamic theming */
:root {
  --primary: #4f46e5;
  --secondary: #6b7280;
  --accent: #10b981;
  --background: #ffffff;
  --text: #111827;
  --border: #e5e7eb;
  
  /* Assessment-specific colors */
  --champion: #059669;
  --builder: #0891b2;
  --risk: #ea580c;
  --alert: #dc2626;
  --crisis: #991b1b;
}

/* Dark theme overrides */
[data-theme="dark"] {
  --background: #111827;
  --text: #f9fafb;
  --border: #374151;
}
```

```typescript
// Tailwind configuration for semantic colors
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        background: 'var(--background)',
        text: 'var(--text)',
        border: 'var(--border)',
        // Score category colors
        champion: 'var(--champion)',
        builder: 'var(--builder)',
        risk: 'var(--risk)',
        alert: 'var(--alert)',
        crisis: 'var(--crisis)',
      }
    }
  }
}
```

### Assessment State Management
```typescript
// types/assessment.ts
interface AssessmentState {
  sessionId: string;
  assessmentId: string;
  currentStep: number;
  totalSteps: number;
  responses: Record<string, string>;
  email?: string;
  contactInfo?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
  };
  scores?: {
    total: number;
    breakdown: {
      valueAssurance: number;
      customerSafe: number;
      riskCompliance: number;
      governance: number;
    };
  };
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
}

type AssessmentAction = 
  | { type: 'SET_SESSION'; payload: { sessionId: string; assessmentId: string } }
  | { type: 'UPDATE_RESPONSES'; payload: { step: number; responses: Record<string, string> } }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_CONTACT_INFO'; payload: Partial<AssessmentState['contactInfo']> }
  | { type: 'SET_SCORES'; payload: AssessmentState['scores'] }
  | { type: 'COMPLETE_ASSESSMENT' }
  | { type: 'NEXT_STEP' }
  | { type: 'RESET' };

// contexts/AssessmentContext.tsx
const AssessmentContext = createContext<{
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
} | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);
  
  // Auto-save to localStorage on state changes
  useEffect(() => {
    localStorage.setItem('assessment-state', JSON.stringify(state));
  }, [state]);

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
}
```

### API Route Implementation Patterns
```typescript
// lib/api-helpers.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validData = schema.parse(body);
      return await handler(req, validData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        }, { status: 400 });
      }
      throw error;
    }
  };
}

export function withSessionValidation<T>(
  handler: (req: NextRequest, session: Session, data?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, data?: T) => {
    const session = await getSession(req);
    
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please start a new assessment.',
          action: 'restart'
        }
      }, { status: 401 });
    }
    
    return await handler(req, session, data);
  };
}

// Example usage in API route
export const POST = withValidation(
  saveProgressSchema,
  withSessionValidation(async (req, session, data) => {
    // Implementation with validated data and session
    const result = await saveAssessmentProgress(session.assessmentId, data);
    return NextResponse.json({ success: true, ...result });
  })
);
```

### Database Schema with Prisma
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Assessment {
  id          String   @id @default(uuid())
  sessionId   String   @unique
  
  // Assessment data
  responses        Json     // {"q1": "A", "q2": "B", ...}
  totalScore       Int?     // 0-100 overall score
  scoreBreakdown   Json?    // {"valueAssurance": 75, "customerSafe": 80, ...}
  scoreCategory    String?  // 'champion', 'builder', 'risk_zone', 'alert', 'crisis'
  recommendations  String[] // Array of recommendation strings
  
  // User data (scrubbed after 30 days)
  email            String?
  company          String?
  firstName        String?
  lastName         String?
  phone            String?
  
  // HubSpot integration
  hubspotSyncStatus     String  @default("pending") // 'pending', 'synced', 'failed', 'skipped'
  hubspotSyncAttempts   Int     @default(0)
  hubspotContactId      String?
  hubspotSyncError      String?
  hubspotSyncedAt       DateTime?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  completedAt     DateTime?
  emailScrubbedAt DateTime?
  
  // Analytics fields (preserved after email scrub)
  completionTimeSeconds Int?
  browserInfo          Json?
  referrerSource       String?
  abTestVariant        String?
  
  @@index([sessionId])
  @@index([email])
  @@index([createdAt])
  @@index([hubspotSyncStatus])
  @@index([createdAt, totalScore, scoreCategory], name: "analytics_idx")
  @@map("assessments")
}

model AssessmentSession {
  sessionId     String   @id
  currentStep   Int      @default(0)
  responses     Json     @default("{}")
  email         String?
  startedAt     DateTime @default(now())
  lastActivity  DateTime @default(now())
  expiresAt     DateTime @default(dbgenerated("(CURRENT_TIMESTAMP + INTERVAL '24 hours')"))
  
  @@index([expiresAt])
  @@map("assessment_sessions")
}

model HubspotSyncQueue {
  id            String   @id @default(uuid())
  assessmentId  String
  payload       Json
  retryCount    Int      @default(0)
  maxRetries    Int      @default(5)
  nextRetryAt   DateTime @default(now())
  createdAt     DateTime @default(now())
  lastError     String?
  
  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  
  @@index([nextRetryAt])
  @@map("hubspot_sync_queue")
}
```

### HubSpot Integration Service
```typescript
// lib/services/hubspot.ts
import { Client } from '@hubspot/api-client';

export class HubSpotService {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN
    });
  }
  
  async createOrUpdateContact(assessmentData: AssessmentData): Promise<HubSpotResult> {
    const contactData = {
      properties: {
        email: assessmentData.email,
        firstname: assessmentData.firstName,
        lastname: assessmentData.lastName,
        company: assessmentData.company,
        phone: assessmentData.phone,
        
        // Custom properties for AI assessment
        ai_assessment_score: assessmentData.totalScore,
        ai_assessment_category: assessmentData.scoreCategory,
        ai_value_score: assessmentData.scoreBreakdown.valueAssurance,
        ai_customer_score: assessmentData.scoreBreakdown.customerSafe,
        ai_risk_score: assessmentData.scoreBreakdown.riskCompliance,
        ai_governance_score: assessmentData.scoreBreakdown.governance,
        ai_assessment_date: assessmentData.completedAt.toISOString().split('T')[0],
        lead_source: 'AI Reality Check Scorecard'
      }
    };
    
    try {
      const result = await this.client.crm.contacts.basicApi.create(contactData);
      
      // Create deal if qualified for Executive Briefing
      if (this.isExecutiveBriefingQualified(assessmentData)) {
        await this.createExecutiveBriefingDeal(result.id, assessmentData);
      }
      
      return { success: true, contactId: result.id };
      
    } catch (error) {
      // Queue for retry
      await this.queueForRetry(assessmentData);
      throw new Error(`HubSpot sync failed: ${error.message}`);
    }
  }
  
  private async createExecutiveBriefingDeal(contactId: string, data: AssessmentData) {
    const dealData = {
      properties: {
        dealname: `AI Reality Check - ${data.firstName || 'Executive'} (${data.company || 'Company'})`,
        dealstage: 'executive_briefing_requested',
        amount: '5000', // Estimated consulting value
        pipeline: 'ai_consulting_pipeline',
        hubspot_owner_id: process.env.HUBSPOT_OWNER_ID
      },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] // Contact to Deal
        }
      ]
    };
    
    return await this.client.crm.deals.basicApi.create(dealData);
  }
  
  private isExecutiveBriefingQualified(data: AssessmentData): boolean {
    // Qualify if all contact fields complete OR score indicates need for help
    const hasCompleteContact = data.firstName && data.lastName && data.company && data.phone;
    const needsHelp = data.totalScore < 60; // Risk zone, alert, or crisis
    
    return hasCompleteContact || needsHelp;
  }
  
  private async queueForRetry(data: AssessmentData) {
    await prisma.hubspotSyncQueue.create({
      data: {
        assessmentId: data.assessmentId,
        payload: data,
        nextRetryAt: new Date(Date.now() + 60000) // Retry in 1 minute
      }
    });
  }
}
```

### Email Service Implementation
```typescript
// lib/services/email.ts
import { Resend } from 'resend';
import { AssessmentResultsEmail } from '@/emails/assessment-results';
import { render } from '@react-email/render';

export class EmailService {
  private resend: Resend;
  
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  async sendAssessmentResults(
    email: string, 
    templateData: AssessmentEmailData
  ): Promise<EmailResult> {
    try {
      const html = render(AssessmentResultsEmail(templateData));
      const text = render(AssessmentResultsEmail(templateData), { plainText: true });
      
      const subject = this.generateSubject(templateData);
      
      const result = await this.resend.emails.send({
        from: 'Stuart Rench <stuart@aireadycheck.com>',
        to: email,
        subject,
        html,
        text,
        headers: {
          'X-Assessment-ID': templateData.assessmentId,
          'List-Unsubscribe': `<${templateData.unsubscribeUrl}>`
        }
      });
      
      await this.trackEmailSent(email, 'assessment_results', result.id);
      
      return { success: true, messageId: result.id };
      
    } catch (error) {
      await this.queueForRetry(email, templateData, 'assessment_results');
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
  
  private generateSubject(data: AssessmentEmailData): string {
    // A/B test subject lines
    const variants = [
      `AI Reality Check Results: ${data.scoreCategory} (${data.totalScore}/100)`,
      `Your AI Readiness Assessment Results - ${data.scoreCategory}`,
      `${data.firstName || 'Executive'}, your AI Reality Check is complete 🎯`
    ];
    
    // Use hash of email for consistent variant assignment
    const variantIndex = this.getVariantIndex(data.email, variants.length);
    return variants[variantIndex];
  }
  
  private async trackEmailSent(email: string, type: string, messageId: string) {
    // Track email metrics for analytics
    await analytics.track('email_sent', {
      type,
      recipient_hash: crypto.createHash('sha256').update(email).digest('hex'),
      message_id: messageId,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Performance Optimization Strategies

### Core Web Vitals Optimization
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  }
};
```

### Code Splitting Strategy
```typescript
// Dynamic imports for assessment steps
const AssessmentStep = dynamic(() => import('@/components/assessment/Step'), {
  loading: () => <StepSkeleton />,
  ssr: false // Client-side only for form state
});

// Lazy load heavy components
const ScoreVisualization = dynamic(() => import('@/components/ScoreGauge'), {
  loading: () => <div className="animate-pulse h-48 bg-gray-200 rounded" />
});

const ResultsChart = dynamic(() => import('@/components/ResultsChart'), {
  loading: () => <ChartSkeleton />
});
```

### Database Query Optimization
```typescript
// Optimized queries with Prisma
export async function getAssessmentResults(assessmentId: string) {
  return await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      totalScore: true,
      scoreBreakdown: true,
      scoreCategory: true,
      recommendations: true,
      completedAt: true,
      // Exclude sensitive data
      email: false,
      hubspotContactId: false
    }
  });
}

// Batch HubSpot sync queue processing
export async function processSyncQueue() {
  const pendingsyncs = await prisma.hubspotSyncQueue.findMany({
    where: {
      retryCount: { lt: prisma.raw('max_retries') },
      nextRetryAt: { lte: new Date() }
    },
    orderBy: { nextRetryAt: 'asc' },
    take: 10 // Process in batches
  });
  
  // Process with Promise.allSettled to handle individual failures
  const results = await Promise.allSettled(
    pendingsyncs.map(sync => processSingleSync(sync))
  );
  
  return results;
}
```

## Error Handling Implementation

### API Error Response Standard
```typescript
// lib/errors.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return NextResponse.json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString()
      }
    }, { status: error.statusCode });
  }
  
  return NextResponse.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  }, { status: 500 });
}
```

### Background Job Processing
```typescript
// lib/jobs/retry-queue.ts
import Bull from 'bull';

const hubspotRetryQueue = new Bull('hubspot-retry', {
  redis: process.env.REDIS_URL
});

hubspotRetryQueue.process('sync-contact', async (job) => {
  const { assessmentData } = job.data;
  
  try {
    const hubspotService = new HubSpotService();
    await hubspotService.createOrUpdateContact(assessmentData);
    
    // Update assessment record
    await prisma.assessment.update({
      where: { id: assessmentData.assessmentId },
      data: { hubspotSyncStatus: 'synced', hubspotSyncedAt: new Date() }
    });
    
  } catch (error) {
    // Will retry based on job configuration
    throw error;
  }
});

// Add job with retry configuration
export async function queueHubSpotSync(assessmentData: AssessmentData) {
  await hubspotRetryQueue.add('sync-contact', { assessmentData }, {
    attempts: 5,
    backoff: 'exponential',
    delay: 60000 // 1 minute initial delay
  });
}
```

## Security Implementation

### Input Validation with Zod
```typescript
// lib/validation/schemas.ts
export const startAssessmentSchema = z.object({
  email: z.string().email().optional(),
  company: z.string().max(255).optional(),
  referrer: z.string().url().optional(),
  browserInfo: z.object({
    userAgent: z.string(),
    viewport: z.object({
      width: z.number(),
      height: z.number()
    })
  }).optional()
});

export const saveProgressSchema = z.object({
  step: z.number().int().min(0).max(4),
  responses: z.record(z.string(), z.string()),
  email: z.string().email().optional(),
  timeSpent: z.number().int().min(0).max(3600).optional()
});

export const submitAssessmentSchema = z.object({
  finalResponses: z.record(z.string(), z.string()).optional(),
  completionTime: z.number().int().min(0).max(3600),
  feedback: z.string().max(1000).optional()
});
```

### Rate Limiting Implementation
```typescript
// lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
  analytics: true,
});

export async function rateLimitByIP(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${ip}`
  );

  if (!success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
      }
    );
  }

  return null; // No rate limit hit
}
```

This technical architecture provides the complete implementation foundation with proven patterns, optimizations, and security measures for building the AI Reality Check Scorecard system.