# User Experience Flow - AI Reality Check Scorecard

## Overview

Complete user journey specification with progressive data capture, session management, and conversion optimization. The flow is designed to maximize engagement while providing increasing value based on user investment level.

## User Journey Overview

```
Landing Page → Assessment Start → Steps 1-4 (Progressive Capture) →
Results Gate → Progressive Value Delivery → Executive Briefing
```

**Key UX Principles:**

- **Progressive Disclosure:** Information revealed as user invests more time
- **Value-First:** Provide value before requesting information
- **Low Friction:** Optional email capture, no forced registration
- **Mobile Optimized:** 40%+ of executives use mobile devices
- **Professional Tone:** C-suite appropriate language and design

## Detailed User Flow

### 1. Landing Page Experience

**Purpose:** Hook users and drive assessment starts with clear value proposition

#### Key Design Elements

```html
<!-- Hero Section -->
<section class="hero bg-gradient-to-br from-blue-50 to-indigo-100">
  <div class="container mx-auto px-4 py-16">
    <h1 class="mb-6 text-4xl font-bold text-gray-900">
      AI Reality Check: How Ready Is Your Organization?
    </h1>
    <p class="mb-8 max-w-3xl text-xl text-gray-600">
      A 10-minute assessment that reveals your AI readiness across 4 critical areas. Used by
      executives at 500+ companies to evaluate their AI strategy effectiveness.
    </p>

    <!-- Primary CTA -->
    <div class="mb-12 flex flex-col gap-4 sm:flex-row">
      <button class="btn-primary px-8 py-4 text-lg">Start Your AI Reality Check</button>
      <button class="btn-secondary px-8 py-4 text-lg">View Sample Results</button>
    </div>

    <!-- Trust Indicators -->
    <div class="flex items-center gap-8 text-sm text-gray-500">
      <span>✓ 10 minutes to complete</span>
      <span>✓ Immediate personalized results</span>
      <span>✓ No registration required</span>
      <span>✓ GDPR compliant</span>
    </div>
  </div>
</section>
```

#### Social Proof Section

```html
<section class="social-proof bg-white py-16">
  <div class="container mx-auto px-4">
    <h2 class="mb-12 text-center text-2xl font-semibold">
      Trusted by executives at leading companies
    </h2>

    <!-- Company logos placeholder -->
    <div class="grid grid-cols-2 gap-8 opacity-60 md:grid-cols-5">
      <!-- Add actual company logos when available -->
      <div class="h-12 rounded bg-gray-200"></div>
      <div class="h-12 rounded bg-gray-200"></div>
      <div class="h-12 rounded bg-gray-200"></div>
      <div class="h-12 rounded bg-gray-200"></div>
      <div class="h-12 rounded bg-gray-200"></div>
    </div>
  </div>
</section>
```

#### Sample Questions Preview

```html
<section class="preview bg-gray-50 py-16">
  <div class="container mx-auto px-4">
    <h2 class="mb-12 text-center text-2xl font-semibold">What You'll Evaluate</h2>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div class="card rounded-lg bg-white p-6 shadow-sm">
        <div class="mb-4 text-2xl text-blue-600">📊</div>
        <h3 class="mb-2 font-semibold">AI Value Assurance</h3>
        <p class="text-sm text-gray-600">
          ROI tracking, spend controls, and business value measurement
        </p>
      </div>

      <div class="card rounded-lg bg-white p-6 shadow-sm">
        <div class="mb-4 text-2xl text-green-600">🛡️</div>
        <h3 class="mb-2 font-semibold">Customer-Safe AI</h3>
        <p class="text-sm text-gray-600">Reliability, accuracy monitoring, and failure handling</p>
      </div>

      <div class="card rounded-lg bg-white p-6 shadow-sm">
        <div class="mb-4 text-2xl text-orange-600">⚖️</div>
        <h3 class="mb-2 font-semibold">Risk & Compliance</h3>
        <p class="text-sm text-gray-600">
          Privacy compliance, bias testing, and audit capabilities
        </p>
      </div>

      <div class="card rounded-lg bg-white p-6 shadow-sm">
        <div class="mb-4 text-2xl text-purple-600">⚙️</div>
        <h3 class="mb-2 font-semibold">Implementation Governance</h3>
        <p class="text-sm text-gray-600">
          QA processes, version control, and performance monitoring
        </p>
      </div>
    </div>
  </div>
</section>
```

#### Technical Implementation

- **Static Generation:** Pre-render for maximum performance
- **A/B Testing Ready:** Multiple headline and CTA variants
- **Analytics Tracking:** Page views, scroll depth, CTA clicks
- **SEO Optimized:** Meta tags, structured data, sitemap

---

### 2. Assessment Start & Session Creation

**Trigger:** User clicks "Start Your AI Reality Check"

#### Loading Experience

```html
<div class="loading-transition">
  <div class="spinner mb-4"></div>
  <p class="text-gray-600">Preparing your personalized assessment...</p>
  <div class="progress-dots">
    <span class="dot active"></span>
    <span class="dot active"></span>
    <span class="dot"></span>
  </div>
</div>
```

#### Technical Session Creation

```typescript
// Frontend flow
const startAssessment = async () => {
  setLoading(true);

  try {
    const response = await assessmentAPI.start({
      referrer: document.referrer,
      browserInfo: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    });

    // Store session info
    dispatch({
      type: 'SET_SESSION',
      payload: {
        sessionId: response.sessionId,
        assessmentId: response.assessmentId,
      },
    });

    // Navigate to first step
    router.push('/assessment/step/1');
  } catch (error) {
    // Handle error gracefully
    setError('Unable to start assessment. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

### 3. Assessment Steps (1-4) with Progressive Data Capture

#### Step Layout Structure

```html
<div class="assessment-step min-h-screen bg-gray-50">
  <!-- Progress Header -->
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-6">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">Step {currentStep} of {totalSteps}</div>
        <div class="h-2 w-32 rounded-full bg-gray-200">
          <div
            class="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style="width: {(currentStep / totalSteps) * 100}%"
          ></div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="container mx-auto px-4 py-8">
    <div class="mx-auto max-w-2xl">
      <!-- Step Title -->
      <div class="mb-8 text-center">
        <h1 class="mb-2 text-2xl font-bold text-gray-900">{stepTitle}</h1>
        <p class="text-gray-600">{stepDescription}</p>
      </div>

      <!-- Optional Email Capture -->
      {emailCaptureComponent}

      <!-- Questions -->
      <div class="space-y-6">
        {questions.map(question => <QuestionComponent key="{question.id}" />)}
      </div>

      <!-- Navigation -->
      <div class="mt-12 flex items-center justify-between">
        <div class="text-sm text-gray-500">{questionsAnswered} of {totalQuestions} answered</div>
        <button class="btn-primary px-8 py-3" disabled="{!allQuestionsAnswered}">
          {isLastStep ? 'Complete Assessment' : 'Next Step'}
        </button>
      </div>
    </div>
  </main>
</div>
```

#### Progressive Email Capture Strategy

**Placement:** Top of each step form (non-intrusive)

```html
<!-- Email capture component (shown only if email not yet captured) -->
<div class="email-capture mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
  <div class="flex items-start gap-3">
    <div class="mt-1 text-blue-600">📧</div>
    <div class="flex-1">
      <p class="mb-2 text-sm font-medium text-blue-800">
        Get your personalized results emailed to you
      </p>
      <div class="flex gap-2">
        <input
          type="email"
          placeholder="your.email@company.com"
          class="flex-1 rounded border border-blue-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          value="{emailInput}"
          onChange="{handleEmailChange}"
        />
        <button
          class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          disabled="{!isValidEmail}"
        >
          Save
        </button>
      </div>
      <p class="mt-1 text-xs text-blue-600">Optional • We'll never spam you • Easy unsubscribe</p>
    </div>
  </div>
</div>

<!-- Email confirmed state -->
<div class="email-confirmed mb-8 rounded-lg border border-green-200 bg-green-50 p-4">
  <div class="flex items-center gap-3">
    <div class="text-green-600">✅</div>
    <p class="text-sm text-green-800">Results will be emailed to: <strong>{email}</strong></p>
  </div>
</div>
```

#### Email Validation Implementation

```typescript
// Real-time email validation
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleEmailSave = async (email: string) => {
  if (!validateEmail(email)) {
    setEmailError('Please enter a valid email address');
    return;
  }

  try {
    // Save email to current step progress
    await assessmentAPI.saveProgress({
      step: currentStep,
      responses: currentResponses,
      email: email,
    });

    // Update global state
    dispatch({ type: 'SET_EMAIL', payload: email });

    // Show confirmation
    setEmailCaptured(true);

    // Track event
    analytics.track('email_captured', { step: currentStep });
  } catch (error) {
    setEmailError('Unable to save email. Please try again.');
  }
};
```

#### Question Component Design

```html
<div class="question-card rounded-lg border bg-white p-6 shadow-sm">
  <h3 class="mb-4 text-lg font-semibold text-gray-900">{questionText}</h3>

  <div class="space-y-3">
    {answerOptions.map(option => (
    <label
      class="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
    >
      <input
        type="radio"
        name="{questionId}"
        value="{option.value}"
        class="mt-1 text-blue-600"
        onChange="{handleAnswerChange}"
      />
      <div class="flex-1">
        <div class="mb-1 font-medium text-gray-900">{option.label}</div>
        <div class="text-sm text-gray-600">{option.description}</div>
      </div>
    </label>
    ))}
  </div>
</div>
```

#### Auto-Save Implementation

```typescript
// Auto-save responses every few seconds
useEffect(() => {
  const saveInterval = setInterval(() => {
    if (hasUnsavedChanges) {
      saveProgress();
    }
  }, 5000); // Save every 5 seconds

  return () => clearInterval(saveInterval);
}, [hasUnsavedChanges]);

const saveProgress = async () => {
  try {
    await assessmentAPI.saveProgress({
      step: currentStep,
      responses: currentResponses,
      email: capturedEmail,
      timeSpent: Math.floor((Date.now() - stepStartTime) / 1000),
    });

    setHasUnsavedChanges(false);
    setLastSaved(Date.now());
  } catch (error) {
    // Silent retry, don't block user
    console.error('Auto-save failed:', error);
  }
};
```

---

### 4. Assessment Completion & Results Processing

#### Completion Loading Experience

```html
<div
  class="completion-loading flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
>
  <div class="text-center">
    <div class="mb-8">
      <div
        class="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
      ></div>
    </div>

    <div class="space-y-4">
      <div class="loading-step active">
        <div class="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600"></div>
        Analyzing your responses...
      </div>
      <div class="loading-step">
        <div class="mr-2 inline-block h-2 w-2 rounded-full bg-gray-300"></div>
        Calculating AI readiness score...
      </div>
      <div class="loading-step">
        <div class="mr-2 inline-block h-2 w-2 rounded-full bg-gray-300"></div>
        Generating personalized recommendations...
      </div>
      <div class="loading-step">
        <div class="mr-2 inline-block h-2 w-2 rounded-full bg-gray-300"></div>
        Preparing your results...
      </div>
    </div>
  </div>
</div>
```

#### Progressive Loading Animation

```typescript
const LoadingSequence = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    'Analyzing your responses...',
    'Calculating AI readiness score...',
    'Generating personalized recommendations...',
    'Preparing your results...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    // Complete after 4 seconds
    const timeout = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Render loading UI...
};
```

---

### 5. Results Display with Progressive Value Delivery

#### Tier 1: Basic Score Display (Email Required)

```html
<div class="results-page min-h-screen bg-gray-50">
  <!-- Results Header -->
  <section class="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
    <div class="container mx-auto px-4 text-center">
      <h1 class="mb-4 text-3xl font-bold">Your AI Reality Check Results</h1>
      <p class="text-lg text-blue-100">Complete assessment for {company || 'your organization'}</p>
    </div>
  </section>

  <!-- Score Display -->
  <section class="bg-white py-12">
    <div class="container mx-auto px-4 text-center">
      <!-- Score Gauge -->
      <div class="mb-8">
        <ScoreGauge score="{totalScore}" size="large" />
        <h2 class="mt-4 text-4xl font-bold text-gray-900">{totalScore}/100</h2>
        <p class="text-2xl font-semibold text-blue-600">{scoreCategory}</p>
        <p class="mx-auto mt-2 max-w-md text-gray-600">{categoryDescription}</p>
      </div>

      <!-- Score Breakdown -->
      <div class="mx-auto grid max-w-4xl gap-6 md:grid-cols-4">
        {scoreBreakdown.map(area => (
        <div class="rounded-lg bg-gray-50 p-6">
          <div class="mb-1 text-2xl font-bold text-gray-900">{area.score}/100</div>
          <div class="mb-2 text-sm font-medium text-gray-700">{area.name}</div>
          <div class="h-2 w-full rounded-full bg-gray-200">
            <div class="h-2 rounded-full bg-blue-600" style="width: {area.score}%"></div>
          </div>
        </div>
        ))}
      </div>
    </div>
  </section>

  <!-- Email Gate (if no email captured) -->
  {!hasEmail && <EmailGateComponent />}

  <!-- Recommendations (if email captured) -->
  {hasEmail && <RecommendationsComponent />}
</div>
```

#### Email Gate Component (If No Email Captured)

```html
<section class="bg-blue-50 py-16">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-lg">
      <div class="mb-4 text-4xl">📧</div>
      <h3 class="mb-4 text-xl font-bold text-gray-900">Get Your Complete Results</h3>
      <p class="mb-6 text-gray-600">
        Enter your email to access your detailed recommendations and personalized action plan.
      </p>

      <form onSubmit="{handleEmailSubmit}" class="space-y-4">
        <input
          type="email"
          placeholder="your.email@company.com"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          class="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Get My Complete Results
        </button>
      </form>

      <div class="mt-6 text-sm text-gray-500">
        <p>✨ We'll also email you a detailed report</p>
        <p>🔒 We never spam or share your information</p>
      </div>
    </div>
  </div>
</section>
```

#### Tier 2: Enhanced Results (Basic Email Captured)

```html
<!-- Recommendations Section -->
<section class="bg-white py-16">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-4xl">
      <h2 class="mb-12 text-center text-2xl font-bold text-gray-900">
        Your Priority Recommendations
      </h2>

      <div class="space-y-6">
        {recommendations.map((rec, index) => (
        <div class="rounded-lg border-l-4 border-blue-600 bg-gray-50 p-6">
          <div class="flex items-start gap-4">
            <div
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
            >
              {index + 1}
            </div>
            <div class="flex-1">
              <div class="mb-2 flex items-center gap-2">
                <h3 class="font-semibold text-gray-900">{rec.title}</h3>
                <span class="rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                  {rec.priority} Priority
                </span>
              </div>
              <p class="mb-3 text-gray-600">{rec.description}</p>
              <div class="space-y-1">
                {rec.actionItems.map(item => (
                <div class="flex items-start gap-2 text-sm text-gray-700">
                  <span class="mt-1 text-blue-600">•</span>
                  {item}
                </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        ))}
      </div>
    </div>
  </div>
</section>
```

#### Tier 3: Progressive Enhancement Unlock

```html
<!-- Enhancement Opportunity Section -->
<section class="bg-gradient-to-br from-green-50 to-blue-50 py-16">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-lg text-center">
      <div class="mb-4 text-4xl">🎯</div>
      <h3 class="mb-4 text-xl font-bold text-gray-900">Want Even More Personalized Insights?</h3>
      <p class="mb-6 text-gray-600">
        Tell us a bit more about your situation to get industry-specific recommendations and
        benchmarking.
      </p>

      <!-- Expandable Form -->
      <div class="rounded-lg bg-white p-6 shadow-sm">
        <button
          class="font-semibold text-blue-600 transition-colors hover:text-blue-700"
          onClick="{()"
          =""
        >
          setShowEnhancementForm(!showEnhancementForm)} > {showEnhancementForm ? 'Hide' : 'Show'}
          Enhanced Options →
        </button>

        {showEnhancementForm && (
        <form class="mt-6 space-y-4 text-left">
          <div class="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Your first name"
              class="rounded border border-gray-300 px-3 py-2 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Your last name"
              class="rounded border border-gray-300 px-3 py-2 focus:border-blue-500"
            />
          </div>
          <input
            type="text"
            placeholder="Company name"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500"
          />
          <select class="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500">
            <option>Company size...</option>
            <option>1-50 employees</option>
            <option>51-200 employees</option>
            <option>201-1000 employees</option>
            <option>1000+ employees</option>
          </select>
          <button
            type="submit"
            class="w-full rounded bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700"
          >
            Enhance My Report
          </button>
        </form>
        )}
      </div>
    </div>
  </div>
</section>
```

#### Tier 4: Executive Briefing Qualification

```html
<!-- Executive Briefing CTA (appears when qualified) -->
<section class="bg-gradient-to-br from-yellow-50 to-orange-50 py-16">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-2xl rounded-lg border border-yellow-200 bg-white p-8 shadow-lg">
      <div class="mb-6 text-center">
        <div class="mb-4 text-4xl">🗓️</div>
        <div class="mb-2 text-sm font-semibold text-green-600">✨ CONGRATULATIONS! YOU QUALIFY</div>
        <h2 class="mb-4 text-2xl font-bold text-gray-900">Complimentary Executive Briefing</h2>
        <p class="text-gray-600">
          Based on your assessment results, you'd benefit from a personalized 30-minute strategy
          session to discuss your AI implementation roadmap.
        </p>
      </div>

      <div class="mb-6 rounded-lg bg-gray-50 p-6">
        <h3 class="mb-3 font-semibold text-gray-900">What You'll Get:</h3>
        <ul class="space-y-2 text-sm text-gray-700">
          <li class="flex items-start gap-2">
            <span class="mt-1 text-green-600">✓</span>
            Personalized AI strategy recommendations based on your results
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-1 text-green-600">✓</span>
            Industry-specific implementation roadmap
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-1 text-green-600">✓</span>
            ROI optimization opportunities
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-1 text-green-600">✓</span>
            Risk mitigation strategies for your specific situation
          </li>
        </ul>
      </div>

      <div class="text-center">
        <button
          class="mb-4 rounded-lg bg-orange-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-700"
          onClick="{()"
          =""
        >
          window.open(briefingCalendarUrl, '_blank')} > Schedule My Executive Briefing
        </button>
        <p class="text-xs text-gray-500">
          No sales pitch • Just professional guidance • 30 minutes
        </p>
      </div>
    </div>
  </div>
</section>
```

---

### 6. Mobile Experience Optimizations

#### Mobile-First Assessment Flow

```html
<!-- Mobile-optimized step layout -->
<div class="mobile-step md:hidden">
  <!-- Simplified progress bar -->
  <div class="border-b bg-white px-4 py-3">
    <div class="flex items-center justify-between text-sm">
      <span class="text-gray-500">Step {currentStep} of {totalSteps}</span>
      <span class="font-semibold text-blue-600">{Math.round(progress)}%</span>
    </div>
    <div class="mt-2 h-1 w-full rounded-full bg-gray-200">
      <div
        class="h-1 rounded-full bg-blue-600 transition-all duration-300"
        style="width: {progress}%"
      ></div>
    </div>
  </div>

  <!-- Mobile question layout -->
  <div class="space-y-6 p-4">
    <h2 class="text-lg font-semibold text-gray-900">{stepTitle}</h2>

    <!-- Simplified email capture -->
    {!emailCaptured && (
    <div class="rounded-lg bg-blue-50 p-3 text-sm">
      <input
        type="email"
        placeholder="Get results emailed (optional)"
        class="w-full rounded border border-blue-200 px-3 py-2 text-sm"
      />
    </div>
    )}

    <!-- Mobile-friendly questions -->
    <div class="space-y-4">
      {questions.map(question => (
      <MobileQuestionCard key="{question.id}" question="{question}" />
      ))}
    </div>
  </div>

  <!-- Fixed bottom navigation -->
  <div class="fixed bottom-0 left-0 right-0 border-t bg-white px-4 py-3">
    <button
      class="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:bg-gray-300"
      disabled="{!allQuestionsAnswered}"
    >
      {isLastStep ? 'See My Results' : 'Next'}
    </button>
  </div>
</div>
```

#### Touch-Optimized Components

```html
<!-- Mobile question card -->
<div class="mobile-question rounded-lg border bg-white p-4">
  <h3 class="mb-3 text-sm font-medium text-gray-900">{questionText}</h3>

  <div class="space-y-2">
    {answerOptions.map(option => (
    <label class="-mx-1 flex cursor-pointer items-start gap-3 rounded-lg p-3 active:bg-gray-100">
      <input type="radio" name="{questionId}" value="{option.value}" class="mt-0.5 text-blue-600" />
      <span class="text-sm leading-relaxed text-gray-700"> {option.text} </span>
    </label>
    ))}
  </div>
</div>
```

---

### 7. Session Recovery & Resume Flow

#### Resume Assessment Detection

```typescript
// Check for existing session on app load
useEffect(() => {
  const checkExistingSession = async () => {
    try {
      const sessionData = await assessmentAPI.resumeSession();

      if (sessionData.hasActiveAssessment) {
        setShowResumeDialog(true);
        setResumeData(sessionData.assessment);
      }
    } catch (error) {
      // No active session or error - continue normally
    }
  };

  checkExistingSession();
}, []);
```

#### Resume Dialog Component

```html
<div
  class="resume-dialog fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
>
  <div class="m-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
    <h3 class="mb-4 text-lg font-bold text-gray-900">Continue Your Assessment?</h3>

    <p class="mb-4 text-gray-600">
      You have an assessment in progress. You were on step {resumeData.currentStep + 1} of
      {resumeData.totalSteps}.
    </p>

    <div class="mb-6 rounded bg-gray-50 p-3 text-sm">
      <div class="mb-1 flex justify-between">
        <span>Progress:</span>
        <span class="font-semibold">{resumeData.progress.percentage}%</span>
      </div>
      <div class="h-2 w-full rounded-full bg-gray-200">
        <div
          class="h-2 rounded-full bg-blue-600"
          style="width: {resumeData.progress.percentage}%"
        ></div>
      </div>
      <div class="mt-2 text-gray-500">Started: {formatDate(resumeData.startedAt)}</div>
    </div>

    <div class="flex gap-3">
      <button
        class="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        onClick="{()"
        =""
      >
        router.push(resumeData.resumeUrl)} > Continue
      </button>
      <button
        class="flex-1 rounded border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
        onClick="{handleStartNew}"
      >
        Start New
      </button>
    </div>

    <p class="mt-3 text-center text-xs text-gray-500">Sessions expire after 24 hours</p>
  </div>
</div>
```

---

### 8. Error Handling & Edge Cases

#### Network Error Recovery

```html
<div class="error-state mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
  <div class="flex items-start gap-3">
    <div class="text-xl text-yellow-600">⚠️</div>
    <div class="flex-1">
      <h4 class="mb-1 font-semibold text-yellow-800">Connection Issue</h4>
      <p class="mb-3 text-sm text-yellow-700">
        We're having trouble saving your progress. Your answers are saved locally and will sync when
        your connection is restored.
      </p>
      <button
        class="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
        onClick="{handleRetry}"
      >
        Try Again
      </button>
    </div>
  </div>
</div>
```

#### Session Expiry Handling

```typescript
// Handle session expiry gracefully
const handleSessionExpiry = () => {
  // Show user-friendly message
  toast.show({
    title: 'Session Expired',
    message: "Your session has expired. We'll start you with a fresh assessment.",
    type: 'warning',
    duration: 5000,
  });

  // Clear local state
  dispatch({ type: 'RESET' });
  localStorage.removeItem('assessment-state');

  // Redirect to start
  setTimeout(() => {
    router.push('/');
  }, 2000);
};
```

## Performance Optimizations

### Loading States & Skeleton UI

```html
<!-- Assessment step loading skeleton -->
<div class="step-skeleton animate-pulse">
  <div class="mb-8 h-4 w-1/4 rounded bg-gray-200"></div>
  <div class="mb-6 h-8 w-3/4 rounded bg-gray-200"></div>
  <div class="space-y-4">
    <div class="h-20 rounded bg-gray-200"></div>
    <div class="h-20 rounded bg-gray-200"></div>
    <div class="h-20 rounded bg-gray-200"></div>
  </div>
</div>
```

### Lazy Loading & Code Splitting

```typescript
// Lazy load non-critical components
const ScoreVisualization = lazy(() => import('@/components/ScoreVisualization'));
const RecommendationsDetail = lazy(() => import('@/components/RecommendationsDetail'));
const ExecutiveBriefingModal = lazy(() => import('@/components/ExecutiveBriefingModal'));

// Preload next step
useEffect(() => {
  if (currentStep < totalSteps - 1) {
    // Preload next step component
    import(`@/components/steps/Step${currentStep + 1}`);
  }
}, [currentStep]);
```

This comprehensive user experience flow specification provides all the details needed for implementing an engaging, conversion-optimized assessment tool that progressively captures leads while delivering genuine value to C-suite executives.
