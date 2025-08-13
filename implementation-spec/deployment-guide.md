# AI Reality Check Scorecard - Deployment Guide

## Overview

Complete deployment instructions for the AI Reality Check Scorecard system. This guide covers environment setup, configuration, and deployment to production with Vercel, Supabase, and HubSpot integration.

## Prerequisites

### Required Accounts

- **Vercel Account**: For application hosting
- **Supabase Account**: For PostgreSQL database
- **HubSpot Account**: Free CRM for lead management
- **Resend Account**: For email delivery (or SendGrid alternative)
- **Domain**: For custom domain configuration

### Local Development Requirements

- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher
- **Git**: For version control
- **PostgreSQL**: Version 15+ (for local development, optional)

## Environment Configuration

### Environment Variables

Create `.env.local` file in project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://[username]:[password]@[host]:[port]/[database]"
DIRECT_URL="postgresql://[username]:[password]@[host]:[port]/[database]"

# Next.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# HubSpot Integration
HUBSPOT_ACCESS_TOKEN="your-hubspot-access-token"
HUBSPOT_PORTAL_ID="your-hubspot-portal-id"

# Email Service Configuration
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="stuart@stuartrench.com"

# Analytics & Tracking
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
POSTHOG_KEY="your-posthog-key"
POSTHOG_HOST="https://app.posthog.com"

# Session Configuration
SESSION_SECRET="your-session-secret-32-chars-minimum"
ENCRYPTION_KEY="your-encryption-key-32-chars"

# Rate Limiting (Optional - Redis)
REDIS_URL="redis://localhost:6379"

# Environment Flag
NODE_ENV="development"
```

### Production Environment Variables

```bash
# Database Configuration (Supabase)
DATABASE_URL="postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres"

# Next.js Configuration
NEXTAUTH_URL="https://aireadycheck.com"
NEXTAUTH_SECRET="production-secret-min-32-chars"

# HubSpot Integration
HUBSPOT_ACCESS_TOKEN="pat-na1-your-production-token"
HUBSPOT_PORTAL_ID="your-production-portal-id"

# Email Service Configuration
RESEND_API_KEY="re_your-production-api-key"
FROM_EMAIL="stuart@stuartrench.com"

# Analytics & Tracking
GOOGLE_ANALYTICS_ID="G-PRODUCTION-ID"
POSTHOG_KEY="phc_production-key"
POSTHOG_HOST="https://app.posthog.com"

# Session Configuration
SESSION_SECRET="production-session-secret-min-32-chars"
ENCRYPTION_KEY="production-encryption-key-32-chars"

# Environment Flag
NODE_ENV="production"
```

## Local Development Setup

### 1. Project Setup

```bash
# Clone repository
git clone [repository-url]
cd ai-reality-check-scorecard

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your development values

# Setup database
npx prisma generate
npx prisma migrate dev --name initial

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev
```

### 2. Database Setup (Local PostgreSQL)

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb ai_scorecard_dev

# Update .env.local with local database URL
DATABASE_URL="postgresql://[username]@localhost:5432/ai_scorecard_dev"
```

### 3. HubSpot Development Setup

```bash
# Create HubSpot developer account
# Create private app with required scopes:
# - crm.objects.contacts.read
# - crm.objects.contacts.write
# - crm.objects.deals.read
# - crm.objects.deals.write

# Add access token to .env.local
HUBSPOT_ACCESS_TOKEN="pat-na1-your-dev-token"
```

## Production Deployment

### Step 1: Database Setup (Supabase)

1. **Create Supabase Project**

   ```bash
   # Go to supabase.com
   # Create new project
   # Note: Project URL and anon key
   ```

2. **Configure Database**

   ```sql
   -- Enable required extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

3. **Run Migrations**

   ```bash
   # Set production DATABASE_URL in environment
   npx prisma migrate deploy
   ```

4. **Setup Row Level Security (RLS)**

   ```sql
   -- Enable RLS on tables
   ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;

   -- Create policies for session-based access
   CREATE POLICY "Assessment access by session" ON assessments
     FOR ALL USING (session_id = current_setting('app.session_id')::text);
   ```

### Step 2: Vercel Deployment

1. **Connect Repository to Vercel**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Deploy project
   vercel --prod
   ```

2. **Configure Build Settings**

   ```json
   // vercel.json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install",
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

3. **Environment Variables in Vercel**
   ```bash
   # Set all production environment variables in Vercel dashboard
   # Or use Vercel CLI:
   vercel env add DATABASE_URL production
   vercel env add HUBSPOT_ACCESS_TOKEN production
   # ... etc for all variables
   ```

### Step 3: Domain Configuration

1. **Custom Domain Setup**

   ```bash
   # In Vercel dashboard:
   # 1. Add custom domain: aireadycheck.com
   # 2. Configure DNS records:

   # DNS Records:
   # A record: @ -> 76.76.19.61
   # CNAME: www -> cname.vercel-dns.com
   ```

2. **SSL Certificate**
   ```bash
   # Vercel automatically provisions SSL
   # Verify HTTPS is working
   curl -I https://aireadycheck.com
   ```

### Step 4: Email Service Setup

1. **Resend Configuration**

   ```bash
   # Add domain to Resend
   # Configure SPF/DKIM records:

   # DNS Records for Email:
   # TXT @ "v=spf1 include:_spf.resend.com ~all"
   # TXT resend._domainkey "[DKIM-key-from-resend]"
   ```

2. **Email Templates Setup**
   ```typescript
   // Verify email templates are deployed
   // Test email delivery in production
   ```

### Step 5: HubSpot Production Setup

1. **Create Production HubSpot App**

   ```bash
   # Create new private app for production
   # Use production domain in app settings
   # Configure scopes and rate limits
   ```

2. **Custom Properties Setup**
   ```typescript
   // Create required custom properties in HubSpot:
   // - ai_assessment_score (Number)
   // - ai_assessment_category (Single-line text)
   // - ai_value_score (Number)
   // - ai_customer_score (Number)
   // - ai_risk_score (Number)
   // - ai_governance_score (Number)
   // - ai_assessment_date (Date picker)
   // - ai_completion_time (Number)
   // - ai_lead_quality (Single-line text)
   // - lead_source (Single-line text)
   ```

### Step 6: Analytics Setup

1. **Google Analytics**

   ```javascript
   // Add Google Analytics 4 to Next.js
   // Configure goals and conversions
   // Track assessment completions and briefing signups
   ```

2. **PostHog Configuration**
   ```typescript
   // Configure PostHog for user analytics
   // Track funnel metrics and conversion rates
   ```

## Monitoring and Maintenance

### Health Checks

1. **API Health Check**

   ```bash
   # Automated health check endpoint
   curl https://aireadycheck.com/api/health
   ```

2. **Database Connection**

   ```sql
   -- Monitor connection pool status
   -- Check query performance
   -- Monitor storage usage
   ```

3. **External Service Monitoring**
   ```typescript
   // Monitor HubSpot API status
   // Check email delivery rates
   // Track error rates
   ```

### Backup Strategy

1. **Database Backups**

   ```bash
   # Supabase automatic daily backups (included)
   # Weekly full backup to S3 (optional)
   ```

2. **Configuration Backup**
   ```bash
   # Environment variables in secure storage
   # HubSpot configuration documentation
   # DNS configuration backup
   ```

### Performance Monitoring

1. **Core Web Vitals**

   ```typescript
   // Monitor LCP, FID, CLS
   // Set up alerts for performance degradation
   ```

2. **Database Performance**
   ```sql
   -- Monitor query performance
   -- Check index usage
   -- Alert on slow queries
   ```

## Troubleshooting Guide

### Common Issues

1. **Database Connection Errors**

   ```bash
   # Check DATABASE_URL format
   # Verify Supabase project status
   # Check connection limits
   ```

2. **HubSpot Integration Issues**

   ```bash
   # Verify access token validity
   # Check rate limiting
   # Validate custom properties exist
   ```

3. **Email Delivery Problems**

   ```bash
   # Check Resend account status
   # Verify DNS records
   # Check spam folder
   ```

4. **Build/Deployment Failures**
   ```bash
   # Check Node.js version compatibility
   # Verify environment variables
   # Review build logs in Vercel
   ```

### Debug Commands

```bash
# Check environment variables
vercel env ls

# View deployment logs
vercel logs [deployment-url]

# Test database connection
npx prisma db push --preview-feature

# Test API endpoints
curl -X POST https://aireadycheck.com/api/assessment/start \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Security Checklist

### Pre-Deployment Security

- [ ] Environment variables secured (no secrets in code)
- [ ] Database connections use SSL
- [ ] API endpoints have proper authentication
- [ ] Rate limiting configured
- [ ] CORS headers configured properly
- [ ] Input validation implemented
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React default behavior)

### Post-Deployment Security

- [ ] SSL certificate active
- [ ] Security headers configured
- [ ] Access logs monitored
- [ ] Regular dependency updates
- [ ] Database access restricted
- [ ] API rate limits working
- [ ] Error messages don't leak sensitive info

## Performance Optimization

### Pre-Deployment

- [ ] Image optimization enabled
- [ ] Code splitting implemented
- [ ] Bundle size analyzed
- [ ] Database queries optimized
- [ ] Caching strategy implemented

### Post-Deployment

- [ ] CDN performance verified
- [ ] Core Web Vitals < target thresholds
- [ ] API response times < 500ms
- [ ] Database query performance monitored
- [ ] Error rates < 1%

## Rollback Procedure

### Emergency Rollback

```bash
# Immediate rollback to previous deployment
vercel rollback [previous-deployment-url]

# Database rollback (if needed)
npx prisma migrate reset --force
npx prisma migrate deploy
```

### Planned Rollback

```bash
# Create rollback branch
git checkout -b rollback-to-v1.0
git revert [commit-hash]
git push origin rollback-to-v1.0

# Deploy rollback
vercel --prod
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] HubSpot integration verified
- [ ] Email templates tested
- [ ] Analytics tracking implemented
- [ ] Error handling tested
- [ ] Security measures implemented
- [ ] Performance optimized

### Deployment

- [ ] Production database setup
- [ ] Vercel deployment successful
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] DNS records configured
- [ ] Email delivery working

### Post-Deployment

- [ ] Health checks passing
- [ ] Analytics tracking
- [ ] HubSpot sync working
- [ ] Email delivery confirmed
- [ ] Performance metrics good
- [ ] Error monitoring active
- [ ] User acceptance testing complete

---

_Last Updated: 2025-08-12_  
_Status: Complete deployment guide ready for production_
