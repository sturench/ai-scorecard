# AI Reality Check Scorecard

Executive AI readiness assessment platform built with Next.js 14.2, TypeScript, PostgreSQL, and Prisma ORM. This application provides a comprehensive evaluation of organizational AI preparedness across four critical dimensions.

## 🎯 Overview

The AI Reality Check Scorecard is designed for executives and decision-makers to assess their organization's readiness for AI implementation. The platform evaluates:

- **AI Value Assurance** - Ability to deliver and capture value from AI initiatives
- **Customer-Safe AI** - Safeguards and protocols for customer-facing AI deployments
- **Model Risk & Compliance** - Risk management frameworks and regulatory compliance
- **Implementation Governance** - Organizational structures for AI implementation

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 15+ database
- npm or yarn package manager

### Environment Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd ai-scorecard
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Required: Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_scorecard"

# Required: HubSpot CRM Integration
HUBSPOT_ACCESS_TOKEN=your_hubspot_private_app_token
HUBSPOT_OWNER_ID=your_hubspot_owner_id

# Required: Email Service
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL="your-email@domain.com"
```

4. Initialize the database:

```bash
npm run db:generate
npm run db:migrate
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14.2 (App Router), React 18.3, TypeScript 5.5
- **Styling**: Tailwind CSS 3.4 with CSS custom properties
- **Database**: PostgreSQL 15+ with Prisma ORM
- **CRM Integration**: HubSpot API for lead management
- **Email**: Resend/SendGrid for automated communications
- **Analytics**: Vercel Analytics & Speed Insights
- **Testing**: Jest + React Testing Library (TDD ready)

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── assessment/         # Assessment flow pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles & CSS variables
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── theme/            # Theme provider
│   ├── assessment/       # Assessment-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility functions & services
│   ├── services/         # External service integrations
│   ├── validation/       # Zod schemas
│   └── utils/           # Helper functions
├── prisma/              # Database schema & migrations
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## 🧪 Development Workflow

### Testing (TDD Ready)

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Reset database (development only)
npm run db:reset
```

### Code Quality

```bash
# Lint and fix
npm run lint:fix

# Type checking
npm run typecheck

# Format code
npm run format
```

## 📊 Assessment Flow

### 4-Step Evaluation Process

1. **Step 1**: AI Value Assurance (4 questions)
2. **Step 2**: Customer-Safe AI (4 questions) - Highest weight (35%)
3. **Step 3**: Model Risk & Compliance (4 questions) - 25% weight
4. **Step 4**: Implementation Governance (4 questions) - 15% weight

### Scoring System

- **Champion** (80-100): Excellent AI readiness
- **Builder** (60-79): Good foundation, some gaps
- **Risk Zone** (40-59): Significant preparation needed
- **Alert** (20-39): Major gaps, high risk
- **Crisis** (0-19): Immediate attention required

## 🔌 Integrations

### HubSpot CRM

Automatic lead qualification and deal creation:

- Contact creation/updates with assessment scores
- Executive briefing deal generation for qualified leads
- Custom properties for AI assessment data
- Retry queue for failed sync operations

### Email Automation

Personalized results delivery:

- React Email templates with assessment results
- A/B testing for subject lines and content
- Delivery tracking and analytics
- Follow-up sequences for incomplete assessments

## 🚦 Performance

### Core Web Vitals Optimized

- Image optimization with WebP/AVIF formats
- Code splitting and lazy loading
- CSS custom properties for theming
- Minimal JavaScript bundle size

### Mobile-First Design

- 44px minimum touch targets
- Responsive typography scaling
- Executive-friendly UX patterns
- Optimized for 40%+ mobile executive users

## 🔒 Privacy & Security

### Data Protection

- 30-day email retention with automatic PII scrubbing
- Anonymous long-term analytics capability
- GDPR-compliant data handling
- Secure session management (24-hour expiry)

### Security Features

- Input validation with Zod schemas
- Rate limiting (optional with Upstash Redis)
- CSRF protection
- Secure headers configuration

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables for Production

```env
# Production URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# Database (use managed PostgreSQL)
DATABASE_URL="postgresql://..."

# HubSpot Production
HUBSPOT_ACCESS_TOKEN=prod_token
HUBSPOT_OWNER_ID=prod_owner_id

# Email Service
RESEND_API_KEY=prod_resend_key
FROM_EMAIL="production@yourdomain.com"

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
GOOGLE_SITE_VERIFICATION=your_verification_code
```

## 📈 Analytics & Monitoring

### Built-in Tracking

- Assessment completion rates
- Step abandonment analysis
- Score distribution analytics
- Email engagement metrics
- Performance monitoring

### Key Performance Indicators

- \>70% assessment completion rate
- \>15% executive briefing conversion
- <2s average page load time
- \>65% mobile completion rate

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Issues**

- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists and is accessible

**HubSpot Sync Failures**

- Verify HUBSPOT_ACCESS_TOKEN permissions
- Check rate limiting (100 requests per 10 seconds)
- Review sync queue in database

**Email Delivery Issues**

- Confirm RESEND_API_KEY is valid
- Check FROM_EMAIL domain verification
- Monitor email event logs

## 📚 Additional Resources

- [Technical Architecture Documentation](./implementation-spec/technical-architecture.md)
- [API Specification](./implementation-spec/api-specification.md)
- [Database Design](./implementation-spec/database-design.md)
- [Deployment Guide](./implementation-spec/deployment-guide.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

Private - All rights reserved

---

Built with ❤️ for executive AI readiness assessment
