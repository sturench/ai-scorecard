# System Overview - AI Reality Check Scorecard

## Executive Summary

The AI Reality Check Scorecard is a lead generation tool disguised as a valuable assessment for C-suite executives. It evaluates organizational AI readiness across 4 critical areas through a 10-minute assessment that progressively captures contact information and qualifies leads for consulting services.

## System Architecture

### High-Level Component Flow

```
Landing Page → Assessment Flow (4 Steps) → Results Display → Lead Qualification → HubSpot CRM
     ↓              ↓                        ↓                  ↓
Session Create → Progress Save → Scoring Algorithm → Email Automation
```

### Core System Components

#### 1. Assessment Engine

- **Purpose:** Deliver 16 questions across 4 evaluation areas
- **Structure:** Sequential step flow with progress persistence
- **Scoring:** Weighted algorithm producing 0-100 score with category classification
- **Session Management:** 24-hour sessions with localStorage backup

#### 2. Lead Capture System

- **Strategy:** Progressive data collection (optional email → enhanced details → executive briefing qualification)
- **Integration:** Real-time HubSpot sync with fallback queuing
- **Qualification:** Score-based and form completion-based lead quality scoring

#### 3. Results Delivery System

- **Display:** Interactive results page with score visualization
- **Email:** Automated results delivery with personalized recommendations
- **Follow-up:** Triggered email sequences based on completion status and score

#### 4. CRM Integration

- **Platform:** HubSpot Free CRM (100 requests/10 seconds limit)
- **Data Sync:** Contact creation, custom properties, deal pipeline integration
- **Resilience:** Retry queue for failed syncs with exponential backoff

## Data Flow Architecture

### User Journey Data Flow

1. **Landing Page Visit** → Analytics tracking, A/B test assignment
2. **Assessment Start** → Session creation, initial database record
3. **Step Progression** → Response storage, progress updates, optional email capture
4. **Assessment Completion** → Scoring calculation, results generation
5. **Results Display** → HubSpot sync, email delivery, conversion tracking

### Data Persistence Strategy

```
Frontend State (React Context) ↔ LocalStorage (Backup) ↔ Database (Source of Truth) ↔ HubSpot (CRM)
```

## Key Architecture Decisions

### ADR-001: Next.js with App Router

**Decision:** Use Next.js 14.2.x with App Router
**Rationale:**

- Excellent performance optimization out of the box
- API routes eliminate need for separate backend
- Vercel deployment optimization
- React 18 features for better UX

### ADR-002: PostgreSQL Database

**Decision:** PostgreSQL with Prisma ORM vs. NoSQL alternatives
**Rationale:**

- Structured assessment data requires consistency
- Complex scoring queries need relational capabilities
- GDPR compliance easier with SQL
- Prisma provides type safety and migration management

### ADR-003: Progressive Data Capture

**Decision:** Optional email capture during assessment vs. gate at end
**Rationale:**

- Higher email capture rates (can capture on any step)
- Enables follow-up for incomplete assessments
- Reduces abandonment at results gate
- Supports progressive lead qualification

### ADR-004: HubSpot Direct Integration

**Decision:** Direct HubSpot API vs. Zapier/webhook intermediary
**Rationale:**

- Real-time lead qualification and follow-up
- Lower latency for Executive Briefing qualification
- Direct control over retry logic and error handling
- Cost effective for expected volume

### ADR-005: Session-Based Authentication

**Decision:** Session cookies vs. user registration system
**Rationale:**

- No user management complexity
- Faster assessment start (no registration friction)
- HubSpot serves as user data source of truth
- 24-hour session sufficient for assessment completion

## Assessment Scoring Framework

### Scoring Areas & Weights

1. **AI Value Assurance (25%)** - ROI measurement, spend controls, KPI tracking
2. **Customer-Safe AI (35%)** - Reliability, accuracy monitoring, failure handling
3. **Model Risk & Compliance (25%)** - Privacy compliance, bias testing, audit trails
4. **Implementation Governance (15%)** - QA processes, version control, monitoring

### Score Categories

- **80-100: AI Reality Champion** - Excellence with mature processes
- **60-79: AI Value Builder** - Good foundation with specific gaps
- **40-59: AI Risk Zone** - Significant issues preventing value realization
- **20-39: AI Theater Alert** - Creating more risk than value
- **0-19: AI Crisis Mode** - Immediate intervention needed

### Scoring Algorithm

```javascript
const calculateScore = (responses) => {
  const areaScores = {
    valueAssurance: calculateAreaScore(responses.valueAssurance) * 0.25,
    customerSafe: calculateAreaScore(responses.customerSafe) * 0.35,
    riskCompliance: calculateAreaScore(responses.riskCompliance) * 0.25,
    governance: calculateAreaScore(responses.governance) * 0.15,
  };

  return Math.round(Object.values(areaScores).reduce((sum, score) => sum + score, 0));
};
```

## Lead Qualification Logic

### Tier 1: Basic Lead (Email Only)

- **Qualification:** Valid email address provided
- **HubSpot Sync:** Contact creation with assessment scores
- **Follow-up:** Results email delivery
- **Lead Quality:** "basic"

### Tier 2: Enhanced Lead (Email + Company + Name)

- **Qualification:** Contact details provided
- **HubSpot Sync:** Enhanced contact record with company data
- **Follow-up:** Personalized results with industry context
- **Lead Quality:** "enhanced"

### Tier 3: Executive Briefing Qualified

- **Qualification:** All contact fields complete OR score <60 (needs help)
- **HubSpot Sync:** Deal creation in Executive Briefing pipeline
- **Follow-up:** Immediate calendar booking opportunity
- **Lead Quality:** "executive_briefing_qualified"

## Privacy & Data Management

### Data Retention Policy

- **Email Addresses:** Auto-scrubbed after 30 days
- **Assessment Scores:** Retained indefinitely (anonymized for analytics)
- **Session Data:** Purged after 24 hours
- **HubSpot Data:** Managed by HubSpot retention settings

### GDPR Compliance Strategy

- **Explicit Consent:** Optional email capture with clear purpose
- **Right to Deletion:** Manual purge function available
- **Data Minimization:** No permanent PII storage beyond 30 days
- **Transparency:** Clear privacy policy and data usage

## Integration Architecture

### HubSpot CRM Integration

```
Assessment Completion → Contact Creation/Update → Deal Creation (if qualified) → Email List Assignment
```

**Key HubSpot Objects:**

- **Contacts:** Assessment participants with scores and metadata
- **Deals:** Executive briefing opportunities
- **Custom Properties:** AI assessment scores (max 10 on free tier)
- **Lists:** Segmentation by score ranges and lead quality

### Email Automation System

```
Assessment Event → Template Selection → Personalization → Delivery → Tracking
```

**Email Triggers:**

- Assessment completion → Results delivery
- 24 hours incomplete → Reminder email
- 3 days post-completion → Follow-up email
- Executive briefing qualified → Calendar scheduling email

### Analytics Integration

- **Vercel Analytics:** Core Web Vitals and page performance
- **Custom Events:** Assessment funnel tracking
- **Microsoft Clarity:** Heatmaps and user behavior (free tier)
- **Error Tracking:** Sentry for error monitoring

## Performance Requirements

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint):** <2.5 seconds
- **FID (First Input Delay):** <100 milliseconds
- **CLS (Cumulative Layout Shift):** <0.1

### API Performance

- **Assessment Save:** <500ms response time
- **Results Generation:** <2 seconds
- **HubSpot Sync:** <3 seconds (with retry fallback)
- **Email Delivery:** <5 seconds (with retry fallback)

### Scalability Targets

- **Concurrent Users:** 1000+ supported via Vercel auto-scaling
- **Daily Assessments:** 500+ with current infrastructure
- **Database Growth:** Optimized for 100k+ assessment records

## Security Architecture

### API Security

- **Rate Limiting:** 10 assessment starts per hour per IP
- **Input Validation:** Zod schemas for all API inputs
- **CSRF Protection:** Built-in Next.js middleware
- **Session Security:** HTTP-only cookies, secure flag

### Data Protection

- **Encryption:** All data encrypted in transit and at rest
- **Access Control:** No direct database access from frontend
- **API Keys:** Server-side only, never exposed to client
- **Audit Logging:** All assessment events logged

## Development Environment Setup

### Required Services

1. **Database:** PostgreSQL 15+ (local or Supabase)
2. **HubSpot:** Private app with contacts and deals API access
3. **Email:** Resend or SendGrid account with API key
4. **Analytics:** Vercel Analytics (included with deployment)

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# HubSpot Integration
HUBSPOT_ACCESS_TOKEN=pat-...
HUBSPOT_PORTAL_ID=...

# Email Service
RESEND_API_KEY=re_...

# Analytics & Monitoring
NEXT_PUBLIC_GA_ID=G-...
SENTRY_DSN=https://...
```

## Monitoring & Maintenance

### Key Metrics to Monitor

- **Assessment Completion Rate:** Target >70%
- **API Success Rate:** Target >98%
- **Email Delivery Rate:** Target >95%
- **HubSpot Sync Success:** Target >98%
- **Page Load Times:** Target <2 seconds

### Automated Maintenance

- **Daily:** Email scrubbing job (remove PII after 30 days)
- **Hourly:** Session cleanup (expired sessions)
- **Weekly:** Database statistics update
- **Monthly:** Retry queue cleanup

## Deployment Architecture

### Recommended Platform: Vercel

- **Frontend:** Static generation for landing page, SSR for assessment flow
- **API Routes:** Serverless functions with edge runtime where possible
- **Database:** Connection pooling via Prisma
- **CDN:** Global edge network for static assets
- **Monitoring:** Built-in analytics and performance monitoring

### Alternative Deployment Options

- **Self-hosted:** Docker containers with PostgreSQL and Redis
- **AWS:** ECS with RDS and ElastiCache
- **Railway:** Simplified deployment with managed PostgreSQL

---

This system overview provides the foundational understanding needed for implementation. The architecture balances simplicity for MVP development with clear upgrade paths for enhanced features and scale.
