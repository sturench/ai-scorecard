/**
 * Mock email service for testing
 * Provides realistic mock implementations for email operations
 */

export interface MockEmailOptions {
  shouldFail?: boolean;
  delay?: number;
  errorType?: 'network' | 'auth' | 'quota' | 'validation';
}

export class MockEmailService {
  private sentEmails: Array<{
    id: string;
    to: string;
    subject: string;
    html: string;
    timestamp: Date;
  }> = [];

  private options: MockEmailOptions = {};
  private nextEmailId = 1;

  // Main send method
  send = jest
    .fn()
    .mockImplementation(
      async (emailData: {
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
        from?: string;
        replyTo?: string;
      }) => {
        // Simulate network delay if specified
        if (this.options.delay) {
          await new Promise((resolve) => setTimeout(resolve, this.options.delay));
        }

        // Simulate various error scenarios
        if (this.options.shouldFail) {
          switch (this.options.errorType) {
            case 'network':
              throw new Error('Network error: Unable to connect to email service');

            case 'auth':
              const authError = new Error('Authentication failed');
              (authError as any).status = 401;
              throw authError;

            case 'quota':
              const quotaError = new Error('Rate limit exceeded');
              (quotaError as any).status = 429;
              (quotaError as any).headers = { 'retry-after': '3600' };
              throw quotaError;

            case 'validation':
              throw new Error('Invalid email address');

            default:
              throw new Error('Email sending failed');
          }
        }

        // Simulate successful email sending
        const emailId = `mock-email-${this.nextEmailId++}`;
        const timestamp = new Date();

        // Store sent email for testing verification
        const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
        recipients.forEach((recipient) => {
          this.sentEmails.push({
            id: emailId,
            to: recipient,
            subject: emailData.subject,
            html: emailData.html || emailData.text || '',
            timestamp,
          });
        });

        return {
          id: emailId,
          data: null,
          error: null,
        };
      }
    );

  // Helper methods for testing
  getSentEmails() {
    return [...this.sentEmails];
  }

  getEmailsSentTo(email: string) {
    return this.sentEmails.filter((e) => e.to === email);
  }

  getEmailsWithSubject(subject: string) {
    return this.sentEmails.filter((e) => e.subject.includes(subject));
  }

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1] || null;
  }

  clearSentEmails() {
    this.sentEmails = [];
    this.send.mockClear();
  }

  reset() {
    this.clearSentEmails();
    this.options = {};
    this.nextEmailId = 1;
  }

  // Configure mock behavior
  configure(options: MockEmailOptions) {
    this.options = { ...this.options, ...options };
  }

  // Simulate specific error scenarios
  simulateNetworkError() {
    this.configure({ shouldFail: true, errorType: 'network' });
  }

  simulateAuthError() {
    this.configure({ shouldFail: true, errorType: 'auth' });
  }

  simulateRateLimit() {
    this.configure({ shouldFail: true, errorType: 'quota' });
  }

  simulateValidationError() {
    this.configure({ shouldFail: true, errorType: 'validation' });
  }

  simulateDelay(ms: number) {
    this.configure({ delay: ms });
  }

  // Restore normal behavior
  simulateSuccess() {
    this.configure({ shouldFail: false });
  }
}

// Export singleton instance for use in tests
export const mockEmailService = new MockEmailService();

// Reset function for use in test setup
export const resetEmailMocks = () => {
  mockEmailService.reset();
};

// Pre-configured email templates for testing
export const mockEmailTemplates = {
  assessmentComplete: {
    subject: 'Your AI Readiness Assessment Results',
    html: '<html><body><h1>Assessment Complete</h1><p>Thank you for completing the assessment.</p></body></html>',
  },

  executiveBriefing: {
    subject: 'Executive AI Readiness Briefing - Schedule Your Session',
    html: '<html><body><h1>Executive Briefing</h1><p>Schedule your personalized briefing session.</p></body></html>',
  },

  followUp: {
    subject: 'Complete Your AI Readiness Assessment',
    html: '<html><body><h1>Complete Assessment</h1><p>Finish your AI readiness evaluation.</p></body></html>',
  },

  reminder: {
    subject: 'Reminder: Your AI Assessment is Waiting',
    html: '<html><body><h1>Reminder</h1><p>Complete your assessment to get personalized insights.</p></body></html>',
  },
};

// Email validation helpers for testing
export const emailTestHelpers = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  extractEmailFromHtml: (html: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return html.match(emailRegex) || [];
  },

  containsPersonalization: (html: string, firstName: string, company?: string): boolean => {
    const hasFirstName = html.includes(firstName);
    const hasCompany = company ? html.includes(company) : true;
    return hasFirstName && hasCompany;
  },

  hasUnsubscribeLink: (html: string): boolean => {
    return html.toLowerCase().includes('unsubscribe') && html.includes('http');
  },
};
