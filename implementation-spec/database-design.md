# Database Design - AI Reality Check Scorecard

## Overview

Simple, privacy-focused database design that uses HubSpot as the source of truth for user data while maintaining local assessment records for performance and analytics. The design prioritizes GDPR compliance with automatic PII scrubbing and anonymous long-term analytics.

## Core Design Principles

1. **No Local User Management** - HubSpot is the single source of truth for user data
2. **Privacy by Design** - Email addresses auto-scrubbed after 30 days
3. **Anonymous Analytics** - Long-term pattern analysis without PII
4. **Resilient Syncing** - Queue failed HubSpot syncs for retry
5. **Session-Based** - 24-hour sessions for assessment completion
6. **Audit-Ready** - Complete tracking of assessment events

## Entity Relationship Diagram

```
assessments (1) ←→ (0..n) hubspot_sync_queue
     ↓
assessment_sessions (1:1, temporary)
```

## Database Schema

### Primary Table: Assessments

The core table storing all assessment attempts and results.

```sql
CREATE TABLE assessments (
  -- Core identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL, -- For resuming incomplete assessments

  -- Assessment data
  responses JSONB NOT NULL, -- {"q1": "A", "q2": "B", "value_assurance_1": "C", ...}
  total_score INTEGER, -- 0-100 overall score
  score_breakdown JSONB, -- {"value_assurance": 75, "customer_safe": 80, "risk_compliance": 60, "governance": 55}
  score_category VARCHAR(50), -- 'champion', 'builder', 'risk_zone', 'alert', 'crisis'
  recommendations TEXT[], -- Array of recommendation strings

  -- User data (scrubbed after 30 days)
  email VARCHAR(255), -- Optional, scrubbed after 30 days
  first_name VARCHAR(255), -- Optional, scrubbed after 30 days
  last_name VARCHAR(255), -- Optional, scrubbed after 30 days
  company VARCHAR(255), -- Optional, scrubbed after 30 days
  phone VARCHAR(255), -- Optional, scrubbed after 30 days

  -- HubSpot integration tracking
  hubspot_sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'failed', 'skipped'
  hubspot_sync_attempts INTEGER DEFAULT 0,
  hubspot_contact_id VARCHAR(255), -- HubSpot contact ID after sync
  hubspot_deal_id VARCHAR(255), -- HubSpot deal ID if executive briefing qualified
  hubspot_sync_error TEXT, -- Last error message if failed
  hubspot_synced_at TIMESTAMP,

  -- Email delivery tracking
  email_delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
  email_delivery_attempts INTEGER DEFAULT 0,
  email_delivered_at TIMESTAMP,
  email_delivery_error TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP, -- NULL if incomplete
  email_scrubbed_at TIMESTAMP, -- When PII was removed

  -- Analytics fields (preserved after email scrub)
  completion_time_seconds INTEGER, -- Time to complete assessment
  browser_info JSONB, -- {"browser": "Chrome", "version": "91", "device": "desktop", "os": "macOS"}
  referrer_source VARCHAR(255), -- Where user came from
  ab_test_variant VARCHAR(50), -- For A/B testing tracking
  ip_address_hash VARCHAR(64), -- Hashed IP for analytics (no raw IP stored)

  -- Lead quality scoring
  lead_quality VARCHAR(50) DEFAULT 'basic', -- 'basic', 'enhanced', 'executive_briefing_qualified'
  qualified_for_briefing BOOLEAN DEFAULT FALSE
);

-- Performance indexes
CREATE INDEX idx_assessments_session_id ON assessments(session_id);
CREATE INDEX idx_assessments_email ON assessments(email) WHERE email IS NOT NULL;
CREATE INDEX idx_assessments_created_at ON assessments(created_at);
CREATE INDEX idx_assessments_completed ON assessments(completed_at) WHERE completed_at IS NOT NULL;

-- HubSpot sync indexes
CREATE INDEX idx_assessments_hubspot_sync ON assessments(hubspot_sync_status)
  WHERE hubspot_sync_status IN ('pending', 'failed');
CREATE INDEX idx_assessments_hubspot_retry ON assessments(hubspot_sync_status, hubspot_sync_attempts, created_at)
  WHERE hubspot_sync_status = 'failed' AND hubspot_sync_attempts < 5;

-- Email delivery indexes
CREATE INDEX idx_assessments_email_delivery ON assessments(email_delivery_status)
  WHERE email_delivery_status IN ('pending', 'failed');

-- Privacy compliance indexes
CREATE INDEX idx_assessments_email_scrub ON assessments(created_at)
  WHERE email IS NOT NULL AND email_scrubbed_at IS NULL;

-- Analytics indexes (for preserved data)
CREATE INDEX idx_assessments_analytics ON assessments(created_at, total_score, score_category)
  WHERE completed_at IS NOT NULL;
CREATE INDEX idx_assessments_lead_quality ON assessments(created_at, lead_quality, qualified_for_briefing);
```

### Session Storage Table

Temporary storage for in-progress assessment state.

```sql
CREATE TABLE assessment_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  current_step INTEGER DEFAULT 0, -- Current step index (0-based)
  total_steps INTEGER DEFAULT 4, -- Always 4 for current assessment
  responses JSONB DEFAULT '{}', -- Responses saved so far

  -- Progressive data capture
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company VARCHAR(255),
  phone VARCHAR(255),

  -- Session metadata
  ip_address_hash VARCHAR(64), -- Hashed IP for rate limiting
  user_agent TEXT,
  referrer_source VARCHAR(255),
  ab_test_variant VARCHAR(50),

  -- Timestamps
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Auto-cleanup expired sessions
CREATE INDEX idx_sessions_expires ON assessment_sessions(expires_at);
CREATE INDEX idx_sessions_activity ON assessment_sessions(last_activity);
CREATE INDEX idx_sessions_ip_hash ON assessment_sessions(ip_address_hash, started_at); -- For rate limiting
```

### HubSpot Sync Queue Table

Managing failed HubSpot syncs with retry logic.

```sql
CREATE TABLE hubspot_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,

  -- Sync data
  payload JSONB NOT NULL, -- Complete data to sync to HubSpot
  sync_type VARCHAR(50) NOT NULL, -- 'contact', 'deal', 'contact_and_deal'

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  next_retry_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  retry_delay_seconds INTEGER DEFAULT 60, -- Current delay between retries

  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_attempt_at TIMESTAMP,
  last_error TEXT,

  -- Success tracking
  completed_at TIMESTAMP,
  hubspot_contact_id VARCHAR(255),
  hubspot_deal_id VARCHAR(255)
);

-- Retry processing index
CREATE INDEX idx_sync_queue_retry ON hubspot_sync_queue(next_retry_at, retry_count)
  WHERE completed_at IS NULL AND retry_count < max_retries;

-- Performance monitoring
CREATE INDEX idx_sync_queue_assessment ON hubspot_sync_queue(assessment_id);
CREATE INDEX idx_sync_queue_created ON hubspot_sync_queue(created_at);
```

### Email Queue Table (Optional Enhancement)

If implementing advanced email automation beyond basic results delivery.

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,

  -- Email details
  recipient_email VARCHAR(255) NOT NULL,
  template_name VARCHAR(100) NOT NULL, -- 'assessment_results', 'incomplete_followup', etc.
  template_data JSONB NOT NULL, -- Data for email template

  -- Scheduling
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_error TEXT,

  -- Email service response
  email_service_id VARCHAR(255), -- Resend/SendGrid message ID
  delivery_status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'sent', 'delivered', 'bounced', 'failed'
);

CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_at, retry_count)
  WHERE sent_at IS NULL AND retry_count < max_retries;
CREATE INDEX idx_email_queue_assessment ON email_queue(assessment_id);
```

## Data Types and Constraints

### JSONB Field Structures

#### Assessment Responses

```json
{
  "value_assurance_1": "A",
  "value_assurance_2": "B",
  "value_assurance_3": "C",
  "value_assurance_4": "A",
  "customer_safe_1": "B",
  "customer_safe_2": "A",
  "customer_safe_3": "C",
  "customer_safe_4": "B",
  "risk_compliance_1": "C",
  "risk_compliance_2": "B",
  "risk_compliance_3": "A",
  "risk_compliance_4": "C",
  "governance_1": "B",
  "governance_2": "A",
  "governance_3": "C",
  "governance_4": "B"
}
```

#### Score Breakdown

```json
{
  "value_assurance": 75, // 0-100, weighted 25%
  "customer_safe": 80, // 0-100, weighted 35%
  "risk_compliance": 60, // 0-100, weighted 25%
  "governance": 55 // 0-100, weighted 15%
}
```

#### Browser Info

```json
{
  "browser": "Chrome",
  "version": "91.0.4472.124",
  "device": "desktop", // "desktop", "mobile", "tablet"
  "os": "macOS",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "timezone": "America/New_York"
}
```

### Enum Constraints

```sql
-- Add check constraints for enum-like fields
ALTER TABLE assessments ADD CONSTRAINT chk_score_category
  CHECK (score_category IN ('champion', 'builder', 'risk_zone', 'alert', 'crisis'));

ALTER TABLE assessments ADD CONSTRAINT chk_hubspot_sync_status
  CHECK (hubspot_sync_status IN ('pending', 'synced', 'failed', 'skipped'));

ALTER TABLE assessments ADD CONSTRAINT chk_email_delivery_status
  CHECK (email_delivery_status IN ('pending', 'sent', 'failed', 'skipped'));

ALTER TABLE assessments ADD CONSTRAINT chk_lead_quality
  CHECK (lead_quality IN ('basic', 'enhanced', 'executive_briefing_qualified'));

ALTER TABLE assessments ADD CONSTRAINT chk_total_score_range
  CHECK (total_score >= 0 AND total_score <= 100);

-- Session step validation
ALTER TABLE assessment_sessions ADD CONSTRAINT chk_current_step
  CHECK (current_step >= 0 AND current_step <= 4);
```

## Data Retention & Privacy Compliance

### Automated Email Scrubbing (GDPR Compliance)

```sql
-- Scheduled job to run daily at 2 AM
-- Creates a stored procedure for email scrubbing
CREATE OR REPLACE FUNCTION scrub_expired_emails()
RETURNS INTEGER AS $$
DECLARE
  scrubbed_count INTEGER;
BEGIN
  UPDATE assessments
  SET
    email = NULL,
    first_name = NULL,
    last_name = NULL,
    company = NULL,
    phone = NULL,
    email_scrubbed_at = CURRENT_TIMESTAMP
  WHERE
    created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND email IS NOT NULL
    AND email_scrubbed_at IS NULL;

  GET DIAGNOSTICS scrubbed_count = ROW_COUNT;

  -- Log the scrubbing event
  INSERT INTO system_logs (event_type, message, data, created_at)
  VALUES ('email_scrub', 'Automated email scrubbing completed',
          json_build_object('records_scrubbed', scrubbed_count),
          CURRENT_TIMESTAMP);

  RETURN scrubbed_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available) or external cron
-- SELECT cron.schedule('email-scrub', '0 2 * * *', 'SELECT scrub_expired_emails();');
```

### Manual Data Purge Functions

```sql
-- Function to manually purge old assessments (admin use)
CREATE OR REPLACE FUNCTION purge_old_assessments(older_than_days INTEGER)
RETURNS TABLE(
  deleted_assessments INTEGER,
  deleted_sessions INTEGER,
  deleted_queue_items INTEGER
) AS $$
DECLARE
  assessment_count INTEGER;
  session_count INTEGER;
  queue_count INTEGER;
BEGIN
  -- Delete old assessment sessions first
  DELETE FROM assessment_sessions
  WHERE started_at < CURRENT_TIMESTAMP - INTERVAL (older_than_days || ' days');
  GET DIAGNOSTICS session_count = ROW_COUNT;

  -- Delete related queue items (will cascade from assessments)
  SELECT COUNT(*) INTO queue_count
  FROM hubspot_sync_queue hsq
  JOIN assessments a ON hsq.assessment_id = a.id
  WHERE a.created_at < CURRENT_TIMESTAMP - INTERVAL (older_than_days || ' days');

  -- Delete old assessments (cascades to queue items)
  DELETE FROM assessments
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL (older_than_days || ' days');
  GET DIAGNOSTICS assessment_count = ROW_COUNT;

  RETURN QUERY SELECT assessment_count, session_count, queue_count;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM purge_old_assessments(365); -- Delete records older than 1 year
```

### Session Cleanup

```sql
-- Scheduled job to run every hour
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  DELETE FROM assessment_sessions
  WHERE expires_at < CURRENT_TIMESTAMP;

  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;
```

## Database Triggers

### Auto-Update Timestamps

```sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assessments table
CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update last_activity on session updates
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_activity
  BEFORE UPDATE ON assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();
```

### HubSpot Sync Queue Management

```sql
-- Auto-increment retry delay on failures
CREATE OR REPLACE FUNCTION increment_retry_delay()
RETURNS TRIGGER AS $$
BEGIN
  -- Exponential backoff: 60s, 300s, 900s, 1800s, 3600s
  NEW.retry_delay_seconds = LEAST(3600, NEW.retry_delay_seconds * POWER(2, NEW.retry_count));
  NEW.next_retry_at = CURRENT_TIMESTAMP + INTERVAL (NEW.retry_delay_seconds || ' seconds');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hubspot_retry_delay
  BEFORE UPDATE ON hubspot_sync_queue
  FOR EACH ROW
  WHEN (NEW.retry_count > OLD.retry_count)
  EXECUTE FUNCTION increment_retry_delay();
```

## Sample Queries

### Assessment Analytics

```sql
-- Monthly assessment completion stats
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_started,
  COUNT(completed_at) as total_completed,
  ROUND(COUNT(completed_at) * 100.0 / COUNT(*), 2) as completion_rate,
  ROUND(AVG(total_score), 1) as avg_score,
  ROUND(AVG(completion_time_seconds), 0) as avg_completion_time
FROM assessments
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Score distribution analysis
SELECT
  score_category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage,
  ROUND(AVG(total_score), 1) as avg_score,
  MIN(total_score) as min_score,
  MAX(total_score) as max_score
FROM assessments
WHERE completed_at IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY score_category
ORDER BY avg_score DESC;

-- Lead quality funnel
SELECT
  lead_quality,
  COUNT(*) as leads,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
  COUNT(CASE WHEN qualified_for_briefing THEN 1 END) as briefing_qualified,
  ROUND(AVG(total_score), 1) as avg_score
FROM assessments
WHERE completed_at IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY lead_quality
ORDER BY
  CASE lead_quality
    WHEN 'executive_briefing_qualified' THEN 3
    WHEN 'enhanced' THEN 2
    WHEN 'basic' THEN 1
  END DESC;
```

### HubSpot Sync Monitoring

```sql
-- HubSpot sync success rates
SELECT
  DATE_TRUNC('day', created_at) as sync_date,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN hubspot_sync_status = 'synced' THEN 1 END) as successful,
  COUNT(CASE WHEN hubspot_sync_status = 'failed' THEN 1 END) as failed,
  ROUND(COUNT(CASE WHEN hubspot_sync_status = 'synced' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM assessments
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND email IS NOT NULL -- Only count assessments that should sync
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY sync_date DESC;

-- Failed syncs requiring attention
SELECT
  a.id,
  a.email,
  a.company,
  a.total_score,
  a.hubspot_sync_attempts,
  a.hubspot_sync_error,
  a.created_at
FROM assessments a
WHERE a.hubspot_sync_status = 'failed'
  AND a.hubspot_sync_attempts >= 5
  AND a.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY a.created_at DESC;

-- Retry queue status
SELECT
  sync_type,
  COUNT(*) as pending_items,
  MIN(next_retry_at) as next_retry,
  MAX(retry_count) as max_retries_reached
FROM hubspot_sync_queue
WHERE completed_at IS NULL
GROUP BY sync_type;
```

### Performance Monitoring

```sql
-- Assessment completion time analysis
SELECT
  score_category,
  COUNT(*) as assessments,
  ROUND(AVG(completion_time_seconds), 0) as avg_seconds,
  ROUND(AVG(completion_time_seconds) / 60.0, 1) as avg_minutes,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY completion_time_seconds) as median_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY completion_time_seconds) as p95_seconds
FROM assessments
WHERE completion_time_seconds IS NOT NULL
  AND completion_time_seconds BETWEEN 60 AND 1800 -- Filter outliers
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY score_category
ORDER BY avg_seconds;

-- Database table sizes and growth
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Migration Scripts

### Initial Database Setup

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For password hashing if needed

-- Create tables (in order of dependencies)
-- assessment_sessions (no dependencies)
-- assessments (no dependencies)
-- hubspot_sync_queue (depends on assessments)
-- email_queue (depends on assessments)

-- Create indexes
-- Create functions
-- Create triggers
-- Create constraints

-- Insert reference data if needed
INSERT INTO system_settings (key, value, description) VALUES
  ('email_retention_days', '30', 'Days to retain email addresses before scrubbing'),
  ('session_timeout_hours', '24', 'Hours before assessment session expires'),
  ('hubspot_max_retries', '5', 'Maximum retry attempts for HubSpot sync'),
  ('email_max_retries', '3', 'Maximum retry attempts for email delivery');
```

### Environment-Specific Configuration

```sql
-- Development environment
INSERT INTO system_settings (key, value) VALUES
  ('hubspot_sync_enabled', 'false'), -- Disable HubSpot in dev
  ('email_delivery_enabled', 'false'), -- Disable emails in dev
  ('debug_logging_enabled', 'true');

-- Production environment
INSERT INTO system_settings (key, value) VALUES
  ('hubspot_sync_enabled', 'true'),
  ('email_delivery_enabled', 'true'),
  ('debug_logging_enabled', 'false');
```

## Database Provider Recommendations

### Primary Recommendation: Supabase

- **Pros:** Built on PostgreSQL, automatic backups, built-in cron jobs, row-level security, free tier sufficient for MVP
- **Connection:** Direct Prisma connection via DATABASE_URL
- **Cron Jobs:** Built-in for automated maintenance
- **Scaling:** Automatic with usage-based pricing

### Alternative: Neon

- **Pros:** Serverless PostgreSQL, auto-scaling, branching for dev/staging, excellent Vercel integration
- **Connection:** Connection pooling built-in
- **Branching:** Separate databases for development/staging
- **Scaling:** Transparent auto-scaling

### Alternative: Railway PostgreSQL

- **Pros:** Simple setup, good performance, automatic backups
- **Connection:** Direct DATABASE_URL
- **Management:** Web-based admin interface
- **Pricing:** Predictable monthly pricing

### Self-Hosted Considerations

Only recommended if you have specific compliance requirements:

- **Setup:** Docker Compose with PostgreSQL + Redis
- **Backups:** Manual setup required (pg_dump + AWS S3)
- **Monitoring:** Manual setup (Prometheus + Grafana)
- **Maintenance:** Manual updates and security patches

## Performance Optimization

### Connection Pooling with Prisma

```typescript
// prisma/client.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Query Optimization Tips

1. **Use Indexes:** All WHERE, ORDER BY, and JOIN columns should be indexed
2. **Limit Results:** Always use LIMIT for large tables
3. **JSON Queries:** Use JSONB operators efficiently: `responses->>'value_assurance_1'`
4. **Aggregations:** Use database aggregations instead of application-level calculations
5. **Connection Pooling:** Essential for serverless functions

## Backup & Recovery Strategy

### Automated Backups

- **Frequency:** Daily incremental, weekly full backup
- **Retention:** 30 days for daily, 12 weeks for weekly
- **Testing:** Monthly backup restoration tests
- **Storage:** Encrypted, geographically distributed

### Point-in-Time Recovery

- **Window:** 7-day point-in-time recovery capability
- **Process:** Automated via database provider
- **Testing:** Quarterly recovery drills

This database design provides a solid foundation for the AI Reality Check Scorecard with privacy compliance, performance optimization, and clear upgrade paths for enhanced features.
