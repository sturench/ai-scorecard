# AI Reality Check Scorecard - Email Templates

## Overview

Professional email templates for assessment results delivery and follow-up nurturing. Templates use placeholder content that maintains proper tone and structure while enabling easy A/B testing and content refinement.

## Template Variables

All templates support personalization variables:

```typescript
interface EmailVariables {
  firstName?: string; // "Stuart" or fallback to email prefix
  email: string; // "stuart@company.com"
  company?: string; // "Acme Corp"
  totalScore: number; // 67
  scoreCategory: string; // "AI Value Builder"
  categoryDescription: string; // Category explanation
  topRecommendations: string[]; // Top 3-5 recommendations
  scoreBreakdown: {
    valueAssurance: number;
    customerSafe: number;
    riskCompliance: number;
    governance: number;
  };
  resultsUrl: string; // Link to detailed results
  briefingUrl?: string; // Calendar link if qualified
}
```

## Primary Email Template: Assessment Results

### Subject Line Options (A/B Test Ready)

```typescript
const SUBJECT_LINES = {
  A: 'AI Reality Check Results: {{scoreCategory}} ({{totalScore}}/100)',
  B: 'Your AI Readiness Assessment Results - {{scoreCategory}}',
  C: '{{firstName}}, your AI Reality Check is complete 🎯',
  D: 'AI Assessment Complete: {{totalScore}}/100 - {{scoreCategory}}',
};
```

### HTML Email Template

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your AI Reality Check Results</title>
    <style>
      /* Responsive email styles */
      .container {
        max-width: 600px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .header {
        background: #1f2937;
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .content {
        padding: 30px 20px;
        background: white;
      }
      .score-card {
        background: #f8fafc;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
      }
      .score-number {
        font-size: 48px;
        font-weight: bold;
        color: #1f2937;
      }
      .score-category {
        font-size: 20px;
        color: #4f46e5;
        margin: 10px 0;
      }
      .recommendations {
        margin: 30px 0;
      }
      .recommendation {
        margin: 15px 0;
        padding: 15px;
        background: #f0f9ff;
        border-left: 4px solid #3b82f6;
      }
      .cta-button {
        background: #4f46e5;
        color: white;
        padding: 15px 30px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin: 20px 0;
      }
      .footer {
        background: #f9fafb;
        padding: 30px 20px;
        text-align: center;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Your AI Reality Check Results</h1>
        <p>Comprehensive AI readiness assessment for {{company || "your organization"}}</p>
      </div>

      <!-- Main Content -->
      <div class="content">
        <p>Hello {{firstName || "there"}},</p>

        <p>
          Thank you for completing the AI Reality Check Assessment. Based on your responses, I've
          analyzed your organization's AI readiness across four critical areas.
        </p>

        <!-- Score Card -->
        <div class="score-card">
          <div class="score-number">{{totalScore}}/100</div>
          <div class="score-category">{{scoreCategory}}</div>
          <p>{{categoryDescription}}</p>
        </div>

        <!-- Score Breakdown -->
        <h3>Your AI Readiness Breakdown</h3>
        <table style="width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>AI Value Assurance:</strong>
            </td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              {{scoreBreakdown.valueAssurance}}/100
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Customer-Safe AI:</strong>
            </td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              {{scoreBreakdown.customerSafe}}/100
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Risk & Compliance:</strong>
            </td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              {{scoreBreakdown.riskCompliance}}/100
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong>Implementation Governance:</strong>
            </td>
            <td style="text-align: right; padding: 8px 0;">{{scoreBreakdown.governance}}/100</td>
          </tr>
        </table>

        <!-- Top Recommendations -->
        <div class="recommendations">
          <h3>Priority Recommendations</h3>
          <p>Based on your assessment, here are the most impactful areas to focus on:</p>

          {{#each topRecommendations}}
          <div class="recommendation"><strong>{{@index}}.</strong> {{this}}</div>
          {{/each}}
        </div>

        <!-- CTA Section -->
        {{#if briefingUrl}}
        <div
          style="text-align: center; margin: 40px 0; padding: 30px; background: #fef7cd; border-radius: 8px;"
        >
          <h3 style="color: #92400e; margin-top: 0;">🗓️ You Qualify for an Executive Briefing</h3>
          <p>
            Based on your responses, you'd benefit from a personalized 30-minute strategy session to
            discuss your AI implementation roadmap.
          </p>
          <a href="{{briefingUrl}}" class="cta-button" style="background: #92400e;"
            >Schedule My Executive Briefing</a
          >
        </div>
        {{else}}
        <div style="text-align: center; margin: 40px 0;">
          <a href="{{resultsUrl}}" class="cta-button">View Detailed Results</a>
        </div>
        {{/if}}

        <!-- Additional Value -->
        <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px;">
          <h4 style="color: #166534; margin-top: 0;">What's Next?</h4>
          <ul style="color: #166534;">
            <li>Review your detailed results at any time using the link above</li>
            <li>Share these insights with your technical and business teams</li>
            <li>Use the recommendations to guide your AI strategy conversations</li>
            {{#if briefingUrl}}
            <li>Schedule an Executive Briefing for personalized guidance</li>
            {{/if}}
          </ul>
        </div>

        <p>
          If you have any questions about your results or recommendations, don't hesitate to reply
          to this email.
        </p>

        <p>
          Best regards,<br />
          <strong>Stuart Rench</strong><br />
          AI Reality Check Specialist
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>
          This assessment was generated by the AI Reality Check Scorecard<br />
          <a href="{{resultsUrl}}" style="color: #4f46e5;">View detailed results</a> |
          <a href="{{{unsubscribeUrl}}}" style="color: #6b7280;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </body>
</html>
```

### Plain Text Version

```
Your AI Reality Check Results

Hello {{firstName || "there"}},

Thank you for completing the AI Reality Check Assessment. Based on your responses, I've analyzed your organization's AI readiness across four critical areas.

YOUR SCORE: {{totalScore}}/100 - {{scoreCategory}}

{{categoryDescription}}

AI READINESS BREAKDOWN:
• AI Value Assurance: {{scoreBreakdown.valueAssurance}}/100
• Customer-Safe AI: {{scoreBreakdown.customerSafe}}/100
• Risk & Compliance: {{scoreBreakdown.riskCompliance}}/100
• Implementation Governance: {{scoreBreakdown.governance}}/100

PRIORITY RECOMMENDATIONS:
{{#each topRecommendations}}
{{@index}}. {{this}}

{{/each}}

{{#if briefingUrl}}
🗓️ YOU QUALIFY FOR AN EXECUTIVE BRIEFING

Based on your responses, you'd benefit from a personalized 30-minute strategy session to discuss your AI implementation roadmap.

Schedule here: {{briefingUrl}}
{{else}}
View your detailed results: {{resultsUrl}}
{{/if}}

WHAT'S NEXT:
- Review your detailed results at any time
- Share these insights with your technical and business teams
- Use the recommendations to guide your AI strategy conversations

If you have any questions about your results, feel free to reply to this email.

Best regards,
Stuart Rench
AI Reality Check Specialist

---
View detailed results: {{resultsUrl}}
Unsubscribe: {{{unsubscribeUrl}}}
```

## Follow-Up Email Templates

### Incomplete Assessment (24 hours later)

**Subject**: "Your AI Reality Check is waiting (takes 8 minutes)"

```html
<div class="container">
  <div class="header">
    <h1>Your AI Assessment is Almost Complete</h1>
  </div>
  <div class="content">
    <p>Hi {{firstName}},</p>

    <p>
      I noticed you started the AI Reality Check Assessment but didn't quite finish. You were
      {{stepsCompleted}} steps through the process.
    </p>

    <p>It only takes about 8 more minutes to complete, and you'll get:</p>
    <ul>
      <li>Your complete AI readiness score</li>
      <li>Personalized recommendations for your situation</li>
      <li>Industry benchmarking insights</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resumeUrl}}" class="cta-button">Continue My Assessment</a>
    </div>

    <p>The link above will take you right back to where you left off.</p>

    <p>Best,<br />Stuart</p>
  </div>
</div>
```

### Results Follow-Up (3 days later)

**Subject**: "Questions about your AI Reality Check results?"

```html
<div class="container">
  <div class="content">
    <p>Hi {{firstName}},</p>

    <p>
      A few days ago, you completed the AI Reality Check Assessment and scored {{totalScore}}/100 as
      an "{{scoreCategory}}".
    </p>

    <p>I'm curious - have you had a chance to review your detailed results and recommendations?</p>

    <p>
      Many executives find it helpful to discuss their specific situation and how to prioritize the
      recommendations. If you'd like a brief conversation about your results, I'm happy to spend
      15-20 minutes walking through what I see in your responses.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{briefingUrl}}" class="cta-button">Schedule a Brief Discussion</a>
    </div>

    <p>
      No sales pitch - just a professional conversation about your AI readiness and what makes sense
      for your situation.
    </p>

    <p>Best regards,<br />Stuart</p>
  </div>
</div>
```

## Email Automation Triggers

### Trigger Conditions

```typescript
interface EmailTrigger {
  name: string;
  condition: string;
  delay: string;
  template: string;
  enabled: boolean;
}

const EMAIL_AUTOMATION = [
  {
    name: 'results_delivery',
    condition: 'assessment_completed && email_provided',
    delay: 'immediate',
    template: 'assessment_results',
    enabled: true,
  },
  {
    name: 'incomplete_followup',
    condition: 'assessment_started && !assessment_completed',
    delay: '24 hours',
    template: 'incomplete_assessment',
    enabled: true,
  },
  {
    name: 'results_followup',
    condition: 'assessment_completed && !briefing_scheduled',
    delay: '3 days',
    template: 'results_followup',
    enabled: true,
  },
  {
    name: 'executive_briefing_reminder',
    condition: 'briefing_qualified && !briefing_scheduled',
    delay: '7 days',
    template: 'briefing_reminder',
    enabled: false, // Enable later
  },
];
```

## Implementation Guidelines

### React Email Integration

```typescript
// Email service using React Email + Resend
import { render } from '@react-email/render';
import { AssessmentResultsEmail } from '@/emails/assessment-results';

export async function sendAssessmentResults(email: string, templateData: EmailVariables) {
  const html = render(AssessmentResultsEmail(templateData));
  const text = render(AssessmentResultsEmail(templateData), { plainText: true });

  const subjectVariant = getABTestVariant('results_email_subject', email);
  const subject = renderTemplate(SUBJECT_LINES[subjectVariant], templateData);

  try {
    const result = await resend.emails.send({
      from: 'Stuart Rench <stuart@stuartrench.com>',
      to: email,
      subject: subject,
      html: html,
      text: text,
      headers: {
        'X-Assessment-ID': templateData.assessmentId,
        'X-AB-Test-Variant': subjectVariant,
      },
    });

    return result;
  } catch (error) {
    logger.error('Email delivery failed', { email, error });
    throw error;
  }
}
```

### A/B Testing Framework

```typescript
const SUBJECT_TESTS = {
  results_email_subject: {
    variants: {
      A: 'AI Reality Check Results: {{scoreCategory}} ({{totalScore}}/100)',
      B: 'Your AI Assessment Results - {{scoreCategory}}',
      C: '{{firstName}}, your AI Reality Check is complete 🎯',
    },
    traffic_split: [34, 33, 33], // Percentage for each variant
  },
};
```

## Compliance & Deliverability

### Required Email Elements

```html
<!-- Physical address (CAN-SPAM compliance) -->
<p style="color: #6b7280; font-size: 12px;">
  Stuart Rench<br />
  [Physical Business Address]<br />
  [City, State, ZIP]
</p>

<!-- Unsubscribe link (required) -->
<a href="{{{unsubscribeUrl}}}" style="color: #6b7280;">Unsubscribe</a>

<!-- Email client preheader -->
<div style="display: none; max-height: 0; overflow: hidden;">
  Your AI readiness score: {{totalScore}}/100 - {{scoreCategory}}
</div>
```

---

_Last Updated: 2025-08-12_  
_Status: Complete email templates ready for implementation_
