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
    <h1 class="text-4xl font-bold text-gray-900 mb-6">
      AI Reality Check: How Ready Is Your Organization?
    </h1>
    <p class="text-xl text-gray-600 mb-8 max-w-3xl">
      A 10-minute assessment that reveals your AI readiness across 4 critical areas. 
      Used by executives at 500+ companies to evaluate their AI strategy effectiveness.
    </p>
    
    <!-- Primary CTA -->
    <div class="flex flex-col sm:flex-row gap-4 mb-12">
      <button class="btn-primary text-lg px-8 py-4">
        Start Your AI Reality Check
      </button>
      <button class="btn-secondary text-lg px-8 py-4">
        View Sample Results
      </button>
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
<section class="social-proof py-16 bg-white">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-semibold text-center mb-12">
      Trusted by executives at leading companies
    </h2>
    
    <!-- Company logos placeholder -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8 opacity-60">
      <!-- Add actual company logos when available -->
      <div class="h-12 bg-gray-200 rounded"></div>
      <div class="h-12 bg-gray-200 rounded"></div>
      <div class="h-12 bg-gray-200 rounded"></div>
      <div class="h-12 bg-gray-200 rounded"></div>
      <div class="h-12 bg-gray-200 rounded"></div>
    </div>
  </div>
</section>
```

#### Sample Questions Preview
```html
<section class="preview py-16 bg-gray-50">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-semibold text-center mb-12">
      What You'll Evaluate
    </h2>
    
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card p-6 bg-white rounded-lg shadow-sm">
        <div class="text-blue-600 text-2xl mb-4">📊</div>
        <h3 class="font-semibold mb-2">AI Value Assurance</h3>
        <p class="text-gray-600 text-sm">ROI tracking, spend controls, and business value measurement</p>
      </div>
      
      <div class="card p-6 bg-white rounded-lg shadow-sm">
        <div class="text-green-600 text-2xl mb-4">🛡️</div>
        <h3 class="font-semibold mb-2">Customer-Safe AI</h3>
        <p class="text-gray-600 text-sm">Reliability, accuracy monitoring, and failure handling</p>
      </div>
      
      <div class="card p-6 bg-white rounded-lg shadow-sm">
        <div class="text-orange-600 text-2xl mb-4">⚖️</div>
        <h3 class="font-semibold mb-2">Risk & Compliance</h3>
        <p class="text-gray-600 text-sm">Privacy compliance, bias testing, and audit capabilities</p>
      </div>
      
      <div class="card p-6 bg-white rounded-lg shadow-sm">
        <div class="text-purple-600 text-2xl mb-4">⚙️</div>
        <h3 class="font-semibold mb-2">Implementation Governance</h3>
        <p class="text-gray-600 text-sm">QA processes, version control, and performance monitoring</p>
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
          height: window.innerHeight 
        }
      }
    });
    
    // Store session info
    dispatch({
      type: 'SET_SESSION',
      payload: {
        sessionId: response.sessionId,
        assessmentId: response.assessmentId
      }
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
        <div class="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>
        <div class="w-32 h-2 bg-gray-200 rounded-full">
          <div 
            class="h-2 bg-blue-600 rounded-full transition-all duration-300"
            style="width: {(currentStep / totalSteps) * 100}%"
          ></div>
        </div>
      </div>
    </div>
  </header>
  
  <!-- Main Content -->
  <main class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <!-- Step Title -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          {stepTitle}
        </h1>
        <p class="text-gray-600">
          {stepDescription}
        </p>
      </div>
      
      <!-- Optional Email Capture -->
      {emailCaptureComponent}
      
      <!-- Questions -->
      <div class="space-y-6">
        {questions.map(question => <QuestionComponent key={question.id} />)}
      </div>
      
      <!-- Navigation -->
      <div class="flex justify-between items-center mt-12">
        <div class="text-sm text-gray-500">
          {questionsAnswered} of {totalQuestions} answered
        </div>
        <button 
          class="btn-primary px-8 py-3"
          disabled={!allQuestionsAnswered}
        >
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
<div class="email-capture mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
  <div class="flex items-start gap-3">
    <div class="text-blue-600 mt-1">📧</div>
    <div class="flex-1">
      <p class="text-sm text-blue-800 font-medium mb-2">
        Get your personalized results emailed to you
      </p>
      <div class="flex gap-2">
        <input 
          type="email" 
          placeholder="your.email@company.com"
          class="flex-1 px-3 py-2 border border-blue-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          value={emailInput}
          onChange={handleEmailChange}
        />
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          disabled={!isValidEmail}
        >
          Save
        </button>
      </div>
      <p class="text-xs text-blue-600 mt-1">
        Optional • We'll never spam you • Easy unsubscribe
      </p>
    </div>
  </div>
</div>

<!-- Email confirmed state -->
<div class="email-confirmed mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
  <div class="flex items-center gap-3">
    <div class="text-green-600">✅</div>
    <p class="text-sm text-green-800">
      Results will be emailed to: <strong>{email}</strong>
    </p>
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
      email: email
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
<div class="question-card bg-white rounded-lg shadow-sm border p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">
    {questionText}
  </h3>
  
  <div class="space-y-3">
    {answerOptions.map(option => (
      <label class="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <input 
          type="radio" 
          name={questionId}
          value={option.value}
          class="mt-1 text-blue-600"
          onChange={handleAnswerChange}
        />
        <div class="flex-1">
          <div class="font-medium text-gray-900 mb-1">
            {option.label}
          </div>
          <div class="text-sm text-gray-600">
            {option.description}
          </div>
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
      timeSpent: Math.floor((Date.now() - stepStartTime) / 1000)
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
<div class="completion-loading min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
  <div class="text-center">
    <div class="mb-8">
      <div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    </div>
    
    <div class="space-y-4">
      <div class="loading-step active">
        <div class="w-2 h-2 bg-blue-600 rounded-full inline-block mr-2"></div>
        Analyzing your responses...
      </div>
      <div class="loading-step">
        <div class="w-2 h-2 bg-gray-300 rounded-full inline-block mr-2"></div>
        Calculating AI readiness score...
      </div>
      <div class="loading-step">
        <div class="w-2 h-2 bg-gray-300 rounded-full inline-block mr-2"></div>
        Generating personalized recommendations...
      </div>
      <div class="loading-step">
        <div class="w-2 h-2 bg-gray-300 rounded-full inline-block mr-2"></div>
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
    "Analyzing your responses...",
    "Calculating AI readiness score...", 
    "Generating personalized recommendations...",
    "Preparing your results..."
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
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
  <section class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
    <div class="container mx-auto px-4 text-center">
      <h1 class="text-3xl font-bold mb-4">
        Your AI Reality Check Results
      </h1>
      <p class="text-blue-100 text-lg">
        Complete assessment for {company || 'your organization'}
      </p>
    </div>
  </section>
  
  <!-- Score Display -->
  <section class="py-12 bg-white">
    <div class="container mx-auto px-4 text-center">
      <!-- Score Gauge -->
      <div class="mb-8">
        <ScoreGauge score={totalScore} size="large" />
        <h2 class="text-4xl font-bold text-gray-900 mt-4">
          {totalScore}/100
        </h2>
        <p class="text-2xl text-blue-600 font-semibold">
          {scoreCategory}
        </p>
        <p class="text-gray-600 max-w-md mx-auto mt-2">
          {categoryDescription}
        </p>
      </div>
      
      <!-- Score Breakdown -->
      <div class="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {scoreBreakdown.map(area => (
          <div class="bg-gray-50 rounded-lg p-6">
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {area.score}/100
            </div>
            <div class="text-sm font-medium text-gray-700 mb-2">
              {area.name}
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full"
                style="width: {area.score}%"
              ></div>
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
<section class="py-16 bg-blue-50">
  <div class="container mx-auto px-4">
    <div class="max-w-lg mx-auto text-center bg-white rounded-lg shadow-lg p-8">
      <div class="text-4xl mb-4">📧</div>
      <h3 class="text-xl font-bold text-gray-900 mb-4">
        Get Your Complete Results
      </h3>
      <p class="text-gray-600 mb-6">
        Enter your email to access your detailed recommendations and personalized action plan.
      </p>
      
      <form onSubmit={handleEmailSubmit} class="space-y-4">
        <input 
          type="email" 
          placeholder="your.email@company.com"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
        <button 
          type="submit"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
<section class="py-16 bg-white">
  <div class="container mx-auto px-4">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 text-center mb-12">
        Your Priority Recommendations
      </h2>
      
      <div class="space-y-6">
        {recommendations.map((rec, index) => (
          <div class="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-600">
            <div class="flex items-start gap-4">
              <div class="bg-blue-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                {index + 1}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="font-semibold text-gray-900">
                    {rec.title}
                  </h3>
                  <span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                    {rec.priority} Priority
                  </span>
                </div>
                <p class="text-gray-600 mb-3">
                  {rec.description}
                </p>
                <div class="space-y-1">
                  {rec.actionItems.map(item => (
                    <div class="text-sm text-gray-700 flex items-start gap-2">
                      <span class="text-blue-600 mt-1">•</span>
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
<section class="py-16 bg-gradient-to-br from-green-50 to-blue-50">
  <div class="container mx-auto px-4">
    <div class="max-w-lg mx-auto text-center">
      <div class="text-4xl mb-4">🎯</div>
      <h3 class="text-xl font-bold text-gray-900 mb-4">
        Want Even More Personalized Insights?
      </h3>
      <p class="text-gray-600 mb-6">
        Tell us a bit more about your situation to get industry-specific recommendations and benchmarking.
      </p>
      
      <!-- Expandable Form -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <button 
          class="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          onClick={() => setShowEnhancementForm(!showEnhancementForm)}
        >
          {showEnhancementForm ? 'Hide' : 'Show'} Enhanced Options →
        </button>
        
        {showEnhancementForm && (
          <form class="mt-6 space-y-4 text-left">
            <div class="grid md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Your first name"
                class="px-3 py-2 border border-gray-300 rounded focus:border-blue-500"
              />
              <input 
                type="text" 
                placeholder="Your last name"
                class="px-3 py-2 border border-gray-300 rounded focus:border-blue-500"
              />
            </div>
            <input 
              type="text" 
              placeholder="Company name"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500"
            />
            <select class="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500">
              <option>Company size...</option>
              <option>1-50 employees</option>
              <option>51-200 employees</option>
              <option>201-1000 employees</option>
              <option>1000+ employees</option>
            </select>
            <button 
              type="submit"
              class="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition-colors"
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
<section class="py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
  <div class="container mx-auto px-4">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 border border-yellow-200">
      <div class="text-center mb-6">
        <div class="text-4xl mb-4">🗓️</div>
        <div class="text-green-600 font-semibold text-sm mb-2">
          ✨ CONGRATULATIONS! YOU QUALIFY
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          Complimentary Executive Briefing
        </h2>
        <p class="text-gray-600">
          Based on your assessment results, you'd benefit from a personalized 30-minute strategy session to discuss your AI implementation roadmap.
        </p>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 class="font-semibold text-gray-900 mb-3">
          What You'll Get:
        </h3>
        <ul class="space-y-2 text-sm text-gray-700">
          <li class="flex items-start gap-2">
            <span class="text-green-600 mt-1">✓</span>
            Personalized AI strategy recommendations based on your results
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-600 mt-1">✓</span>
            Industry-specific implementation roadmap
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-600 mt-1">✓</span>
            ROI optimization opportunities
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-600 mt-1">✓</span>
            Risk mitigation strategies for your specific situation
          </li>
        </ul>
      </div>
      
      <div class="text-center">
        <button 
          class="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors mb-4"
          onClick={() => window.open(briefingCalendarUrl, '_blank')}
        >
          Schedule My Executive Briefing
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
  <div class="bg-white px-4 py-3 border-b">
    <div class="flex items-center justify-between text-sm">
      <span class="text-gray-500">Step {currentStep} of {totalSteps}</span>
      <span class="text-blue-600 font-semibold">{Math.round(progress)}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
      <div 
        class="bg-blue-600 h-1 rounded-full transition-all duration-300"
        style="width: {progress}%"
      ></div>
    </div>
  </div>
  
  <!-- Mobile question layout -->
  <div class="p-4 space-y-6">
    <h2 class="text-lg font-semibold text-gray-900">
      {stepTitle}
    </h2>
    
    <!-- Simplified email capture -->
    {!emailCaptured && (
      <div class="bg-blue-50 p-3 rounded-lg text-sm">
        <input 
          type="email" 
          placeholder="Get results emailed (optional)"
          class="w-full px-3 py-2 text-sm border border-blue-200 rounded"
        />
      </div>
    )}
    
    <!-- Mobile-friendly questions -->
    <div class="space-y-4">
      {questions.map(question => (
        <MobileQuestionCard key={question.id} question={question} />
      ))}
    </div>
  </div>
  
  <!-- Fixed bottom navigation -->
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3">
    <button 
      class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-300"
      disabled={!allQuestionsAnswered}
    >
      {isLastStep ? 'See My Results' : 'Next'}
    </button>
  </div>
</div>
```

#### Touch-Optimized Components
```html
<!-- Mobile question card -->
<div class="mobile-question bg-white rounded-lg border p-4">
  <h3 class="font-medium text-gray-900 mb-3 text-sm">
    {questionText}
  </h3>
  
  <div class="space-y-2">
    {answerOptions.map(option => (
      <label class="flex items-start gap-3 p-3 -mx-1 rounded-lg active:bg-gray-100 cursor-pointer">
        <input 
          type="radio" 
          name={questionId}
          value={option.value}
          class="mt-0.5 text-blue-600"
        />
        <span class="text-sm text-gray-700 leading-relaxed">
          {option.text}
        </span>
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
<div class="resume-dialog fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md">
    <h3 class="text-lg font-bold text-gray-900 mb-4">
      Continue Your Assessment?
    </h3>
    
    <p class="text-gray-600 mb-4">
      You have an assessment in progress. You were on step {resumeData.currentStep + 1} of {resumeData.totalSteps}.
    </p>
    
    <div class="bg-gray-50 rounded p-3 mb-6 text-sm">
      <div class="flex justify-between mb-1">
        <span>Progress:</span>
        <span class="font-semibold">{resumeData.progress.percentage}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full"
          style="width: {resumeData.progress.percentage}%"
        ></div>
      </div>
      <div class="mt-2 text-gray-500">
        Started: {formatDate(resumeData.startedAt)}
      </div>
    </div>
    
    <div class="flex gap-3">
      <button 
        class="flex-1 bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700"
        onClick={() => router.push(resumeData.resumeUrl)}
      >
        Continue
      </button>
      <button 
        class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded font-semibold hover:bg-gray-50"
        onClick={handleStartNew}
      >
        Start New
      </button>
    </div>
    
    <p class="text-xs text-gray-500 mt-3 text-center">
      Sessions expire after 24 hours
    </p>
  </div>
</div>
```

---

### 8. Error Handling & Edge Cases

#### Network Error Recovery
```html
<div class="error-state bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
  <div class="flex items-start gap-3">
    <div class="text-yellow-600 text-xl">⚠️</div>
    <div class="flex-1">
      <h4 class="font-semibold text-yellow-800 mb-1">
        Connection Issue
      </h4>
      <p class="text-yellow-700 text-sm mb-3">
        We're having trouble saving your progress. Your answers are saved locally and will sync when your connection is restored.
      </p>
      <button 
        class="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
        onClick={handleRetry}
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
    message: 'Your session has expired. We\'ll start you with a fresh assessment.',
    type: 'warning',
    duration: 5000
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
  <div class="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
  <div class="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
  <div class="space-y-4">
    <div class="h-20 bg-gray-200 rounded"></div>
    <div class="h-20 bg-gray-200 rounded"></div>
    <div class="h-20 bg-gray-200 rounded"></div>
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