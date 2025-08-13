/**
 * Fixed test data for consistent test scenarios
 * These fixtures provide known data states for predictable testing
 */

// Assessment response fixtures for different score categories
export const assessmentResponseFixtures = {
  pioneer: {
    // High-scoring responses (85-100 range)
    value_assurance_1: 'A', // Comprehensive AI strategy with measurable ROI
    value_assurance_2: 'A', // Board-level AI governance committee
    value_assurance_3: 'A', // AI center of excellence established
    value_assurance_4: 'A', // Dedicated AI budget >$1M

    customer_safe_1: 'A', // Enterprise-grade AI safety protocols
    customer_safe_2: 'A', // Comprehensive bias detection system
    customer_safe_3: 'A', // Real-time AI decision monitoring
    customer_safe_4: 'A', // AI transparency framework implemented
    customer_safe_5: 'A', // Customer AI consent management

    risk_compliance_1: 'A', // Full regulatory compliance framework
    risk_compliance_2: 'A', // Third-party AI audit program
    risk_compliance_3: 'A', // AI risk management office
    risk_compliance_4: 'A', // Automated compliance monitoring

    governance_1: 'A', // Cross-functional AI steering committee
    governance_2: 'A', // AI ethics review board
    governance_3: 'A', // AI deployment approval process
  },

  leader: {
    // Good scores (70-84 range)
    value_assurance_1: 'A', // Comprehensive AI strategy
    value_assurance_2: 'B', // Some AI governance structure
    value_assurance_3: 'A', // AI initiatives in place
    value_assurance_4: 'B', // Moderate AI investment

    customer_safe_1: 'A', // Strong AI safety measures
    customer_safe_2: 'A', // Bias testing implemented
    customer_safe_3: 'B', // Some AI monitoring
    customer_safe_4: 'A', // AI transparency practices
    customer_safe_5: 'B', // Basic customer protections

    risk_compliance_1: 'B', // Some compliance measures
    risk_compliance_2: 'A', // Regular AI assessments
    risk_compliance_3: 'B', // Basic risk management
    risk_compliance_4: 'A', // Some automated monitoring

    governance_1: 'A', // AI governance structure
    governance_2: 'B', // Some ethics oversight
    governance_3: 'A', // Deployment processes defined
  },

  builder: {
    // Medium scores (50-69 range)
    value_assurance_1: 'B', // Some AI strategy
    value_assurance_2: 'C', // Limited governance
    value_assurance_3: 'B', // Pilot AI projects
    value_assurance_4: 'C', // Limited AI budget

    customer_safe_1: 'B', // Basic AI safety measures
    customer_safe_2: 'C', // Limited bias testing
    customer_safe_3: 'C', // Minimal monitoring
    customer_safe_4: 'B', // Some transparency
    customer_safe_5: 'C', // Basic protections

    risk_compliance_1: 'C', // Limited compliance
    risk_compliance_2: 'B', // Some assessments
    risk_compliance_3: 'C', // Basic risk awareness
    risk_compliance_4: 'C', // Manual monitoring

    governance_1: 'B', // Some governance structure
    governance_2: 'C', // Limited ethics oversight
    governance_3: 'B', // Basic deployment process
  },

  beginner: {
    // Lower scores (0-49 range)
    value_assurance_1: 'C', // Limited AI strategy
    value_assurance_2: 'D', // No formal governance
    value_assurance_3: 'C', // Few AI initiatives
    value_assurance_4: 'D', // No dedicated AI budget

    customer_safe_1: 'C', // Minimal AI safety
    customer_safe_2: 'D', // No bias testing
    customer_safe_3: 'D', // No monitoring
    customer_safe_4: 'C', // Limited transparency
    customer_safe_5: 'D', // No specific protections

    risk_compliance_1: 'D', // No compliance framework
    risk_compliance_2: 'C', // Infrequent assessments
    risk_compliance_3: 'D', // No risk management
    risk_compliance_4: 'D', // No monitoring

    governance_1: 'C', // Limited governance
    governance_2: 'D', // No ethics oversight
    governance_3: 'C', // Ad-hoc deployment
  },
};

// Expected score calculations for each category
export const expectedScoreFixtures = {
  pioneer: {
    totalScore: 92,
    scoreBreakdown: {
      valueAssurance: 95,
      customerSafe: 95,
      riskCompliance: 90,
      governance: 85,
    },
    scoreCategory: 'pioneer',
    recommendations: [
      'Continue leading the industry in AI governance and safety',
      'Share best practices with the broader AI community',
      'Explore cutting-edge AI applications while maintaining safety standards',
    ],
  },

  leader: {
    totalScore: 78,
    scoreBreakdown: {
      valueAssurance: 80,
      customerSafe: 82,
      riskCompliance: 75,
      governance: 73,
    },
    scoreCategory: 'leader',
    recommendations: [
      'Strengthen AI governance structure with dedicated committees',
      'Enhance automated monitoring and compliance systems',
      'Develop comprehensive AI ethics framework',
    ],
  },

  builder: {
    totalScore: 58,
    scoreBreakdown: {
      valueAssurance: 55,
      customerSafe: 60,
      riskCompliance: 50,
      governance: 55,
    },
    scoreCategory: 'builder',
    recommendations: [
      'Establish formal AI governance and oversight structure',
      'Implement comprehensive AI safety and bias testing protocols',
      'Develop clear AI deployment and approval processes',
    ],
  },

  beginner: {
    totalScore: 32,
    scoreBreakdown: {
      valueAssurance: 30,
      customerSafe: 35,
      riskCompliance: 25,
      governance: 30,
    },
    scoreCategory: 'beginner',
    recommendations: [
      'Start with AI education and awareness programs',
      'Establish basic AI governance structure and policies',
      'Begin with low-risk AI pilot projects',
    ],
  },
};

// Complete assessment session fixtures
export const assessmentSessionFixtures = {
  newSession: {
    id: 'session-new-001',
    startedAt: new Date('2024-01-15T10:00:00Z'),
    lastActiveAt: new Date('2024-01-15T10:00:00Z'),
    currentStep: 1,
    isCompleted: false,
    responses: {},
    contactInfo: null,
    hubspotContactId: null,
    hubspotDealId: null,
    emailSent: false,
  },

  partialSession: {
    id: 'session-partial-001',
    startedAt: new Date('2024-01-15T10:00:00Z'),
    lastActiveAt: new Date('2024-01-15T10:30:00Z'),
    currentStep: 2,
    isCompleted: false,
    responses: assessmentResponseFixtures.builder,
    contactInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Test Corporation',
      role: 'CTO',
      phone: '+1-555-0123',
    },
    hubspotContactId: null,
    hubspotDealId: null,
    emailSent: false,
  },

  completedSession: {
    id: 'session-complete-001',
    startedAt: new Date('2024-01-15T10:00:00Z'),
    lastActiveAt: new Date('2024-01-15T11:00:00Z'),
    currentStep: 4,
    isCompleted: true,
    responses: assessmentResponseFixtures.leader,
    contactInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      company: 'Innovation Industries',
      role: 'CEO',
      phone: '+1-555-0456',
    },
    hubspotContactId: '12345',
    hubspotDealId: '67890',
    emailSent: true,
  },

  expiredSession: {
    id: 'session-expired-001',
    startedAt: new Date('2024-01-14T10:00:00Z'), // 25 hours ago
    lastActiveAt: new Date('2024-01-14T10:30:00Z'),
    currentStep: 2,
    isCompleted: false,
    responses: {
      value_assurance_1: 'B',
      value_assurance_2: 'A',
    },
    contactInfo: {
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@example.com',
      company: 'Old Corp',
      role: 'Manager',
      phone: '+1-555-0789',
    },
    hubspotContactId: null,
    hubspotDealId: null,
    emailSent: false,
  },
};

// Contact information fixtures
export const contactInfoFixtures = {
  executive: {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@fortune500.com',
    company: 'Fortune 500 Corp',
    role: 'Chief Executive Officer',
    phone: '+1-555-0100',
  },

  technicalLeader: {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@techcorp.com',
    company: 'Tech Innovation Inc',
    role: 'Chief Technology Officer',
    phone: '+1-555-0200',
  },

  businessLeader: {
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@business.com',
    company: 'Business Solutions LLC',
    role: 'Vice President of Operations',
    phone: '+1-555-0300',
  },

  consultant: {
    firstName: 'David',
    lastName: 'Kumar',
    email: 'david.kumar@consulting.com',
    company: 'Strategic Consulting Group',
    role: 'Senior Partner',
    phone: '+1-555-0400',
  },

  invalidEmail: {
    firstName: 'Invalid',
    lastName: 'Email',
    email: 'not-an-email',
    company: 'Test Company',
    role: 'Tester',
    phone: '+1-555-0999',
  },
};

// HubSpot integration fixtures
export const hubspotFixtures = {
  contactResponse: {
    id: '12345',
    properties: {
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane.smith@example.com',
      company: 'Innovation Industries',
      jobtitle: 'CEO',
      phone: '+1-555-0456',
      ai_readiness_score: '78',
      ai_readiness_category: 'leader',
      hs_createdate: '2024-01-15T11:00:00Z',
      hs_lastmodifieddate: '2024-01-15T11:00:00Z',
    },
  },

  dealResponse: {
    id: '67890',
    properties: {
      dealname: 'AI Readiness Assessment - Innovation Industries',
      amount: '25000',
      dealstage: 'qualification',
      ai_readiness_score: '78',
      pipeline: 'default',
      hs_createdate: '2024-01-15T11:00:00Z',
      hs_lastmodifieddate: '2024-01-15T11:00:00Z',
    },
    associations: {
      contacts: {
        results: [{ id: '12345', type: 'contact_to_deal' }],
      },
    },
  },

  syncQueueItems: {
    createContact: {
      id: 'sync-contact-001',
      sessionId: 'session-complete-001',
      operation: 'CREATE_CONTACT',
      payload: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        company: 'Innovation Industries',
        role: 'CEO',
        phone: '+1-555-0456',
        aiReadinessScore: 78,
        scoreCategory: 'leader',
      },
      status: 'PENDING',
      attempts: 0,
      lastAttemptAt: null,
      hubspotId: null,
    },

    createDeal: {
      id: 'sync-deal-001',
      sessionId: 'session-complete-001',
      operation: 'CREATE_DEAL',
      payload: {
        dealName: 'AI Readiness Assessment - Innovation Industries',
        amount: 25000,
        associatedContactId: '12345',
        aiReadinessScore: 78,
        scoreCategory: 'leader',
      },
      status: 'PENDING',
      attempts: 0,
      lastAttemptAt: null,
      hubspotId: null,
    },
  },
};

// Email fixtures
export const emailFixtures = {
  assessmentComplete: {
    to: 'jane.smith@example.com',
    subject: 'Your AI Readiness Assessment Results',
    templateData: {
      firstName: 'Jane',
      company: 'Innovation Industries',
      totalScore: 78,
      scoreCategory: 'leader',
      recommendations: expectedScoreFixtures.leader.recommendations,
      resultsUrl: 'https://example.com/assessment/results/session-complete-001',
    },
  },

  executiveBriefing: {
    to: 'jane.smith@example.com',
    subject: 'Schedule Your Executive AI Readiness Briefing',
    templateData: {
      firstName: 'Jane',
      company: 'Innovation Industries',
      totalScore: 78,
      scoreCategory: 'leader',
      briefingUrl: 'https://calendly.com/ai-readiness-briefing',
    },
  },

  incompleteReminder: {
    to: 'john.doe@example.com',
    subject: 'Complete Your AI Readiness Assessment',
    templateData: {
      firstName: 'John',
      company: 'Test Corporation',
      currentStep: 2,
      totalSteps: 4,
      resumeUrl: 'https://example.com/assessment/resume/session-partial-001',
    },
  },
};
