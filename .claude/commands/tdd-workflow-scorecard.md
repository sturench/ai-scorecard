# AI Scorecard Test-Driven Development (TDD) Workflow Command

To invoke this slash command:

```
/tdd-workflow-scorecard <task-id>
```

## Purpose

This command guides agents through proper Test-Driven Development implementation for the AI Reality Check Scorecard platform while strictly enforcing TDD best practices. It ensures agents write tests for REAL functionality, not mocked behavior, and follow the Red-Green-Refactor cycle correctly.

## Task ID Processing

- **Task/Subtask ID**: {0} (e.g., 14 or 14.3)
- **Implementation Type**: Full TDD cycle for new functionality
- **Quality Focus**: Real functionality testing, not mock verification

## Prerequisites Validation

**Before starting TDD cycle, verify:**

```
✅ Prerequisites Check:
- [ ] Task requirements clearly understood
- [ ] CLAUDE.md testing guidelines reviewed
- [ ] Test environment configured (Next.js 14.2.5 + Jest + React Testing Library)
- [ ] Jest configuration verified (jest.config.js)
- [ ] Project testing commands functional:
  - npm run test (unit tests with watch mode)
  - npm run test:ci (CI tests with coverage)
  - npm run test:components (React component tests)
  - npm run test:api (API route tests)
  - npm run test:db (database integration tests)
  - npm run test:coverage (coverage reporting with 80% threshold)
  - npm run test:integration (integration tests)
```

**If any prerequisite fails, STOP and address the issue first.**

## TDD Cycle Implementation

### Phase 1: RED - Write Failing Test

#### Step 1: Understand Real Functionality Requirements

```
📋 Analyzing task {0} requirements:

From task details, identify:
- What REAL functionality needs to be implemented for AI scorecard assessment?
- What are the actual inputs and expected outputs for scoring logic?
- What business logic needs testing (score calculations, assessments, recommendations)?
- Which external dependencies should be mocked vs. tested?

Key AI Scorecard functionality to test:
- [List actual assessment scoring methods/functions]
- [List real business logic for AI readiness evaluation]
- [List integration points requiring real testing]
```

#### Step 2: Plan Test Strategy (Anti-Pattern Check)

```
🚫 ANTI-PATTERN PREVENTION CHECK:

Will I avoid these critical mistakes?
- [ ] NOT mocking the scorecard calculation method I'm testing
- [ ] NOT mocking database queries (use test database/in-memory if needed)
- [ ] NOT testing mock behavior instead of real scoring functionality
- [ ] NOT hardcoding assessment scores without computation
- [ ] NOT verifying mock calls instead of real scoring outcomes

✅ PROPER TESTING APPROACH:
- [ ] Testing actual assessment scoring logic with real inputs
- [ ] Using realistic executive/company data for testing
- [ ] Mocking only external APIs (email services, third-party integrations)
- [ ] Testing edge cases with real boundary conditions (scores 0-100)
- [ ] Validating real error scenarios, not mocked exceptions
```

#### Step 3: Write Failing Tests

```
🔴 RED PHASE: Writing failing tests

Based on task {0}, creating tests that:
1. **Test real functionality** - not mocked behavior
2. **Use realistic data** - actual assessment responses, company profiles, etc.
3. **Exercise actual logic** - real scoring calculations, recommendations, validations
4. **Mock only externals** - Email services, HubSpot API calls, file operations

Test categories to create:
- [ ] Unit tests for core scoring logic (assessment calculations, recommendations)
- [ ] Integration tests for API routes (real HTTP requests to scorecard endpoints)
- [ ] Component tests for React components (form interactions, score displays)
- [ ] Business logic tests for AI readiness evaluation algorithms
```

**Test file creation pattern:**

```typescript
// Example structure - adapt to actual task
describe('Task {0} - AI Scorecard [Feature Name] Real Functionality', () => {
  beforeEach(() => {
    // Setup REAL test data for AI assessments, not mocks
    // Clear any persistent state if needed
  });

  describe('Core Scoring Logic', () => {
    test('should calculate AI readiness score correctly', () => {
      // Test actual scoring functionality with real assessment responses
      const realAssessmentData = {
        responses: [
          { questionId: 'data-quality', score: 4 },
          { questionId: 'leadership-buy-in', score: 3 },
          // ... more realistic assessment data
        ],
      };

      const result = calculateAIReadinessScore(realAssessmentData);

      // Validate computed score, not hardcoded value
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.categoryScores).toHaveProperty('dataReadiness');
    });

    test('should handle edge case: minimum scores', () => {
      // Test real edge case with actual boundary data
      const minScoreData = {
        responses: Array(10).fill({ score: 1 }), // All minimum scores
      };

      const result = calculateAIReadinessScore(minScoreData);
      expect(result.totalScore).toBe(10); // Computed expectation
    });

    test('should throw error for invalid assessment data', () => {
      // Test actual error conditions, not mocked exceptions
      expect(() => calculateAIReadinessScore(null)).toThrow('Invalid assessment data');
    });
  });

  describe('Integration Testing', () => {
    test('should save assessment results correctly', async () => {
      // Use REAL database operations or in-memory store
      // NO MOCKED DATABASE QUERIES
      const assessmentData = createValidAssessmentData();
      const result = await saveAssessmentResults(assessmentData);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });
});
```

**Run tests to confirm they fail:**

```bash
# Run appropriate test suite based on what was implemented
npm run test                    # For unit tests (watch mode)
npm run test:components        # For React component tests
npm run test:api              # For API route tests
npm run test:integration      # For integration tests
```

**Expected outcome:** Tests fail because functionality doesn't exist yet.

### Phase 2: GREEN - Implement Minimal Code

#### Step 4: Implement Just Enough Code

```
🟢 GREEN PHASE: Minimal implementation

Goal: Make failing tests pass with simplest possible implementation

Implementation guidelines:
- Write only enough code to make tests pass
- Focus on correctness, not optimization
- Ensure real functionality (not hardcoded test responses)
- Follow Next.js 14 App Router patterns
- Maintain TypeScript strict mode compliance
- Follow AI scorecard domain logic requirements
```

**Code implementation approach:**

1. **Create minimal function signatures** that tests can call
2. **Implement core scoring logic** to satisfy test expectations
3. **Add error handling** for test error scenarios
4. **Integrate with real dependencies** (database, external APIs properly mocked)

#### Step 5: Verify Tests Pass

```bash
# Run the same tests that were failing
npm run test                    # Verify unit tests pass
npm run test:components        # Verify component tests pass
npm run test:api              # Verify API tests pass
npm run test:coverage         # Check coverage contribution (80% threshold)
```

**Success criteria:**

- All written tests now pass
- No existing tests broken
- Code implements real functionality (not hardcoded responses)
- External dependencies properly handled
- Coverage meets 80% threshold requirement

### Phase 3: REFACTOR - Clean Up Code

#### Step 6: Refactor While Maintaining Tests

```
🔵 REFACTOR PHASE: Clean up implementation

Refactoring focus areas:
- [ ] Code clarity and readability
- [ ] Type safety improvements (strict TypeScript)
- [ ] Performance optimizations for scoring calculations
- [ ] DRY principle application
- [ ] AI Scorecard domain-specific patterns
- [ ] Proper error handling patterns
- [ ] Consistent naming conventions for scorecard terminology
```

**Refactoring guidelines:**

```typescript
// Example refactoring patterns for AI Scorecard
// Before: Basic implementation
function calculateScore(responses: any) {
  let total = 0;
  responses.forEach((r) => (total += r.score));
  return (total / responses.length) * 20; // Convert to 100-point scale
}

// After: Refactored with proper types and domain logic
interface AssessmentResponse {
  questionId: string;
  categoryId: CategoryId;
  score: number; // 1-5 scale
  weight?: number;
}

interface ScoreResult {
  totalScore: number;
  categoryScores: Record<CategoryId, number>;
  readinessLevel: 'Beginning' | 'Developing' | 'Advanced' | 'Leading';
  recommendations: string[];
}

function calculateAIReadinessScore(responses: AssessmentResponse[]): ScoreResult {
  const categoryWeights = {
    dataReadiness: 0.25,
    leadershipAlignment: 0.2,
    technicalCapability: 0.25,
    processMaturity: 0.15,
    changeReadiness: 0.15,
  };

  const categoryScores = calculateCategoryScores(responses, categoryWeights);
  const totalScore = calculateWeightedTotal(categoryScores, categoryWeights);
  const readinessLevel = determineReadinessLevel(totalScore);
  const recommendations = generateRecommendations(categoryScores, totalScore);

  return {
    totalScore: Math.round(totalScore),
    categoryScores,
    readinessLevel,
    recommendations,
  };
}
```

#### Step 7: Re-run Tests After Refactoring

```bash
# Ensure refactoring didn't break functionality
npm run test:coverage         # Verify tests still pass and coverage maintained
npm run lint                  # Check code standards
npm run typecheck            # Verify TypeScript compliance
```

## Quality Validation

### Step 8: Final Test Review

```
🔍 QUALITY REVIEW CHECKLIST:

Test Quality Assessment:
- [ ] Tests exercise actual AI scoring functionality (not mocks of core logic)
- [ ] Real assessment data flows through real business logic
- [ ] External dependencies mocked appropriately (email, HubSpot API)
- [ ] Internal dependencies NOT mocked (scoring calculations use real logic)
- [ ] Error cases test real failure scenarios (invalid data, boundary conditions)
- [ ] Edge cases use actual boundary conditions (min/max scores, empty responses)
- [ ] Integration tests make real HTTP requests to actual scorecard endpoints
- [ ] Component tests use @testing-library/react correctly for form interactions
- [ ] No React act() warnings (properly handled async state updates)

AI Scorecard Specific Validation:
- [ ] Scoring algorithms produce mathematically correct results
- [ ] Category weightings are applied correctly
- [ ] Readiness level determination logic is accurate
- [ ] Recommendations generation is based on real score thresholds
- [ ] Assessment data validation works with realistic inputs

Coverage Assessment:
- [ ] Minimum 80% coverage achieved for new code
- [ ] Critical scoring paths have 100% coverage
- [ ] Tests contribute meaningfully to overall coverage
- [ ] No artificial coverage boosting (testing trivial code)

Code Quality Assessment:
- [ ] Implementation follows Next.js 14 App Router patterns
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling for scorecard-specific scenarios
- [ ] Domain-specific naming and structure
- [ ] No performance regressions introduced in scoring calculations
```

### Step 9: Integration Verification

```bash
# Run comprehensive test suite to ensure no regressions
npm run test:ci              # Run all tests with coverage
npm run build                # Verify production build success
npm run lint                 # Final lint check
npm run typecheck           # Final TypeScript check
```

## Success Confirmation

**Upon successful TDD completion:**

```
✅ TDD CYCLE COMPLETED SUCCESSFULLY for Task {0}

AI Scorecard Implementation Summary:
- [Feature implemented]: [Brief description of scorecard functionality]
- [Tests created]: [Number and types of tests for scoring logic]
- [Coverage achieved]: [Percentage and critical scoring paths covered]
- [Real functionality validated]: [Key assessment logic tested]

Quality Metrics:
- All tests pass and exercise real AI scorecard functionality
- No anti-patterns detected (no over-mocking of scoring logic)
- Code follows domain-driven design for AI readiness assessment
- TypeScript compilation successful with strict mode
- No linting violations
- Coverage meets 80% threshold requirement

Next Steps:
1. Mark task {0} as completed in Task Master
2. Consider /peer-review {0} for additional quality validation
3. Commit changes with conventional commit format
4. Move to next task in development workflow

TDD cycle successfully maintained focus on REAL AI scorecard functionality testing!
```

## Error Recovery

**If tests mock core functionality:**

```
🚨 ANTI-PATTERN DETECTED: Core functionality mocking

Problem identified:
- Tests are mocking the scoring methods they should be testing
- Mock behavior verification instead of real calculation validation
- Hardcoded assessment scores bypassing actual logic

Recovery actions:
1. STOP current implementation
2. Rewrite tests to test actual scoring functionality
3. Remove core logic mocks (especially scoring calculations)
4. Use real assessment inputs and validate real scoring outputs
5. Restart RED phase with proper tests

Reference: CLAUDE.md "Critical Testing Anti-Patterns (AVOID)" section
```

**If unclear what functionality to test:**

```
⚠️ UNCLEAR REQUIREMENTS: Need task clarification

Current understanding gaps:
- [Unclear scoring requirement 1]
- [Unclear assessment logic requirement 2]
- [Missing AI readiness context 3]

Actions needed:
1. Review task {0} details more thoroughly
2. Consult CLAUDE.md for similar AI scorecard patterns
3. Ask for clarification on specific scoring requirements
4. Identify similar existing scorecard implementations
5. Define clear acceptance criteria for assessment logic before writing tests
```

## Integration with Project Workflow

This TDD command integrates with:

- **Task Master**: Use `tm show {0}` for task context
- **Quality Assurance**: Run `/peer-review {0}` after completion
- **Git Workflow**: Create commits at each TDD phase
- **Continuous Integration**: Tests run automatically with Husky hooks

## Usage Notes

- **Mandatory for new features**: All new AI scorecard functionality must follow TDD
- **Real functionality focus**: Tests must validate actual assessment and scoring logic
- **Anti-pattern enforcement**: Command actively prevents testing anti-patterns
- **Quality gates**: Each phase has validation checkpoints with 80% coverage requirement
- **Domain alignment**: All practices align with AI readiness assessment domain

## Important Reminders

**NEVER:**

- Mock the scoring method you're testing
- Test that mocked functions return mocked assessment values
- Hardcode expected scores without computation
- Use mocked database operations for core scorecard data
- Suppress React act() warnings in component tests

**ALWAYS:**

- Test real scoring functionality with real assessment data
- Mock only external services (email, HubSpot, file operations)
- Use realistic executive/company data for testing
- Validate actual business logic outcomes for AI readiness
- Ensure tests provide genuine confidence in scorecard functionality
- Follow 80% coverage threshold requirement
- Test edge cases with actual boundary conditions (scores 0-100)
