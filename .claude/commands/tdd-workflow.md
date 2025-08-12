# Test-Driven Development (TDD) Workflow Command

To invoke this slash command:
```
/tdd-workflow <task-id>
```

## Purpose
This command guides agents through proper Test-Driven Development implementation while strictly enforcing the CLAUDE.md testing guidelines. It ensures agents write tests for REAL functionality, not mocked behavior, and follow the Red-Green-Refactor cycle correctly.

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
- [ ] Test database available (postgresql://postgres:postgres@localhost:5432/braga_networking_test)
- [ ] Jest configuration verified
- [ ] Project testing commands functional:
  - npm run test (unit tests)
  - npm run test:components (React components)  
  - npm run test:db (database integration)
  - npm run test:coverage (coverage reporting)
```

**If any prerequisite fails, STOP and address the issue first.**

## TDD Cycle Implementation

### Phase 1: RED - Write Failing Test

#### Step 1: Understand Real Functionality Requirements
```
📋 Analyzing task {0} requirements:

From task details, identify:
- What REAL functionality needs to be implemented?
- What are the actual inputs and expected outputs?
- What business logic needs testing?
- Which external dependencies should be mocked vs. tested?

Key functionality to test:
- [List actual methods/functions that will be implemented]
- [List real business logic to validate]
- [List integration points requiring real testing]
```

#### Step 2: Plan Test Strategy (Anti-Pattern Check)
```
🚫 ANTI-PATTERN PREVENTION CHECK:

Will I avoid these critical mistakes?
- [ ] NOT mocking the method I'm testing
- [ ] NOT mocking Prisma queries (use test database instead)
- [ ] NOT testing mock behavior instead of real functionality  
- [ ] NOT hardcoding expected results without computation
- [ ] NOT verifying mock calls instead of real outcomes

✅ PROPER TESTING APPROACH:
- [ ] Testing actual business logic with real inputs
- [ ] Using test database for Prisma operations
- [ ] Mocking only external APIs (Clerk, file uploads)
- [ ] Testing edge cases with real boundary conditions
- [ ] Validating real error scenarios, not mocked exceptions
```

#### Step 3: Write Failing Tests
```
🔴 RED PHASE: Writing failing tests

Based on task {0}, creating tests that:
1. **Test real functionality** - not mocked behavior
2. **Use realistic data** - actual profile data, auth states, etc.
3. **Exercise actual logic** - real calculations, validations, transformations
4. **Mock only externals** - Clerk API calls, file system operations

Test categories to create:
- [ ] Unit tests for core logic (utils, calculations, validations)
- [ ] Integration tests for API routes (real HTTP requests)
- [ ] Component tests for React components (user interactions)
- [ ] Database tests with real Prisma operations (test database)
```

**Test file creation pattern:**
```typescript
// Example structure - adapt to actual task
describe('Task {0} - [Feature Name] Real Functionality', () => {
  beforeEach(() => {
    // Setup REAL test data, not mocks
    // Clear test database state if needed
  });

  describe('Core Business Logic', () => {
    test('should [real behavior description]', () => {
      // Test actual functionality with real inputs
      const realInput = { /* actual data structure */ };
      const result = actualMethodUnderTest(realInput);
      expect(result).toBe(/* computed expected output */);
    });

    test('should handle edge case: [specific boundary]', () => {
      // Test real edge case with actual boundary data
    });

    test('should throw error for: [real error condition]', () => {
      // Test actual error conditions, not mocked exceptions
    });
  });

  describe('Integration Testing', () => {
    test('should integrate with database correctly', async () => {
      // Use REAL Prisma operations with test database
      // NO MOCKED PRISMA QUERIES
    });
  });
});
```

**Run tests to confirm they fail:**
```bash
# Run appropriate test suite based on what was implemented
npm run test                    # For unit tests
npm run test:components        # For React component tests  
npm run test:db               # For database integration tests
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
- Follow Next.js 15 App Router patterns
- Maintain TypeScript strict mode compliance
```

**Code implementation approach:**
1. **Create minimal function signatures** that tests can call
2. **Implement core logic** to satisfy test expectations
3. **Add error handling** for test error scenarios
4. **Integrate with real dependencies** (database, external APIs properly mocked)

#### Step 5: Verify Tests Pass
```bash
# Run the same tests that were failing
npm run test                    # Verify unit tests pass
npm run test:components        # Verify component tests pass
npm run test:db               # Verify integration tests pass
npm run test:coverage         # Check coverage contribution
```

**Success criteria:**
- All written tests now pass
- No existing tests broken
- Code implements real functionality (not hardcoded responses)
- External dependencies properly handled

### Phase 3: REFACTOR - Clean Up Code

#### Step 6: Refactor While Maintaining Tests
```
🔵 REFACTOR PHASE: Clean up implementation

Refactoring focus areas:
- [ ] Code clarity and readability
- [ ] Type safety improvements
- [ ] Performance optimizations
- [ ] DRY principle application
- [ ] CLAUDE.md coding conventions compliance
- [ ] Proper error handling patterns
```

**Refactoring guidelines:**
```typescript
// Example refactoring patterns
// Before: Basic implementation
function calculateProfileCompletion(profile: any) {
  let score = 0;
  if (profile.name) score += 25;
  if (profile.bio) score += 25;
  if (profile.skills?.length > 0) score += 25;
  if (profile.photo) score += 25;
  return score;
}

// After: Refactored with proper types and logic
interface ProfileData {
  name?: string;
  bio?: string;
  skills?: string[];
  photo?: string;
}

function calculateProfileCompletion(profile: ProfileData): number {
  const fields = [
    profile.name?.trim(),
    profile.bio?.trim(), 
    profile.skills?.length ? profile.skills : null,
    profile.photo?.trim()
  ].filter(Boolean);
  
  return Math.round((fields.length / 4) * 100);
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
- [ ] Tests exercise actual functionality (not mocks of core logic)
- [ ] Real data flows through real business logic  
- [ ] External dependencies mocked appropriately (Clerk, APIs)
- [ ] Internal dependencies NOT mocked (Prisma uses test database)
- [ ] Error cases test real failure scenarios
- [ ] Edge cases use actual boundary conditions
- [ ] Integration tests make real HTTP requests to actual endpoints
- [ ] Component tests use @testing-library/react correctly
- [ ] No React act() warnings (properly handled async state)

Coverage Assessment:
- [ ] Minimum 80% coverage achieved for new code
- [ ] Critical paths have 100% coverage  
- [ ] Tests contribute meaningfully to overall coverage
- [ ] No artificial coverage boosting (testing trivial code)

Code Quality Assessment:
- [ ] Implementation follows CLAUDE.md conventions
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling
- [ ] Next.js 15 App Router patterns followed
- [ ] No performance regressions introduced
```

### Step 9: Integration Verification
```bash
# Run comprehensive test suite to ensure no regressions
npm run test:all              # Run all test categories
npm run build                # Verify production build success
npm run lint                  # Final lint check
```

## Success Confirmation

**Upon successful TDD completion:**
```
✅ TDD CYCLE COMPLETED SUCCESSFULLY for Task {0}

Implementation Summary:
- [Feature implemented]: [Brief description]
- [Tests created]: [Number and types of tests]
- [Coverage achieved]: [Percentage and critical paths covered]
- [Real functionality validated]: [Key business logic tested]

Quality Metrics:
- All tests pass and exercise real functionality
- No anti-patterns detected (no over-mocking of core logic)
- Code follows CLAUDE.md standards
- TypeScript compilation successful
- No linting violations

Next Steps:
1. Mark task {0} as completed in Task Master
2. Consider /peer-review {0} for additional quality validation
3. Commit changes with conventional commit format
4. Move to next task in development workflow

TDD cycle successfully maintained focus on REAL functionality testing!
```

## Error Recovery

**If tests mock core functionality:**
```
🚨 ANTI-PATTERN DETECTED: Core functionality mocking

Problem identified:
- Tests are mocking the methods they should be testing
- Mock behavior verification instead of real functionality validation
- Hardcoded responses bypassing actual logic

Recovery actions:
1. STOP current implementation
2. Rewrite tests to test actual functionality
3. Remove core logic mocks
4. Use real inputs and validate real outputs
5. Restart RED phase with proper tests

Reference: CLAUDE.md "Critical Testing Anti-Patterns (AVOID)" section
```

**If unclear what functionality to test:**
```
⚠️ UNCLEAR REQUIREMENTS: Need task clarification

Current understanding gaps:
- [Unclear requirement 1]
- [Unclear requirement 2]
- [Missing context 3]

Actions needed:
1. Review task {0} details more thoroughly
2. Consult CLAUDE.md for similar patterns
3. Ask for clarification on specific requirements
4. Identify similar existing implementations
5. Define clear acceptance criteria before writing tests
```

## Integration with Project Workflow

This TDD command integrates with:
- **Task Master**: Use `tm show {0}` for task context
- **Quality Assurance**: Run `/peer-review {0}` after completion
- **Git Workflow**: Create commits at each TDD phase
- **Continuous Integration**: Tests run automatically on push

## Usage Notes

- **Mandatory for new features**: All new functionality must follow TDD
- **Real functionality focus**: Tests must validate actual business logic
- **Anti-pattern enforcement**: Command actively prevents testing anti-patterns
- **Quality gates**: Each phase has validation checkpoints
- **Documentation alignment**: All practices align with CLAUDE.md standards

## Important Reminders

**NEVER:**
- Mock the method you're testing
- Test that mocked functions return mocked values
- Hardcode expected results without computation
- Use mocked Prisma queries (use test database)
- Suppress React act() warnings

**ALWAYS:**
- Test real functionality with real data
- Mock only external APIs and services
- Use test database for Prisma operations
- Validate actual business logic outcomes
- Ensure tests provide genuine confidence in functionality