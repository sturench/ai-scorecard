# Test Review Slash Command Procedure

## Purpose

Review and validate tests after coding tasks to ensure they properly test actual functionality rather than mocks or superficial behavior.

## Usage

Call this procedure after Claude Code has written or modified tests for any coding task.

**Command**: `/test-review`

## Prerequisites

- Tests have been written or modified as part of a coding task
- Tests are runnable and currently passing
- Access to CLAUDE.md for testing standards reference
- Jest configuration is set up with Next.js integration
- Test database is available for integration tests

## Procedure

### 1. Context Gathering & Test Execution

**Ask user**: "Which tests should I review? Please specify:

- Test files that were created/modified (in /tests/unit/, /tests/integration/, or src/\*\*/**tests**/)
- The original task these tests were written for
- Any specific concerns you have about the test quality"

**Document the response** for context throughout the review.

**Run relevant tests** to ensure they're passing:

```bash
# Run specific test suites based on context
npm run test:unit          # For component/utility tests
npm run test:integration   # For API integration tests
npm run test:api          # For API route tests only
npm run test:components   # For React component tests only
npm run test:coverage     # To check coverage metrics
```

### 2. Load Testing Standards

Reference `CLAUDE.md` sections:

- "Testing Requirements & Anti-Patterns"
- "Critical Testing Anti-Patterns (AVOID)"
- "Proper Testing Approach"
- "Mock Guidelines"

**Note**: Always use the current CLAUDE.md content as the authoritative source.

### 3. Test Analysis Framework

For each test file, systematically check:

#### A. Core Functionality Testing

- **✅ Verify**: Does the test exercise the actual method/function being tested?
- **❌ Flag**: Tests that mock the primary method under test
- **✅ Verify**: Are real inputs processed through real logic?
- **❌ Flag**: Tests that hardcode expected outputs without computation

#### B. Mocking Appropriateness

- **✅ Verify**: Only external dependencies are mocked (APIs, file system, network)
- **❌ Flag**: Core business logic or the method under test is mocked
- **✅ Verify**: Test data flows through real internal methods
- **❌ Flag**: Tests that verify mock calls instead of real behavior

#### C. Test Reality Check

- **✅ Verify**: Tests use realistic input data for the domain (profile data, auth states, etc.)
- **✅ Verify**: Edge cases test actual boundary conditions (RPG ratings, profile completion)
- **✅ Verify**: Error scenarios test real failure modes (Clerk auth failures, database errors)
- **❌ Flag**: Tests that simulate rather than validate real functionality

#### D. Next.js/React-Specific Patterns

- **✅ Verify**: Server Components are tested appropriately (data fetching, rendering)
- **✅ Verify**: Client Components use '@testing-library/react' correctly
- **✅ Verify**: API routes test actual endpoints with real request/response cycles
- **✅ Verify**: Clerk integration tests use proper mocking strategies (external service)
- **❌ Flag**: Tests that mock Next.js internal functionality unnecessarily

### 4. Detailed Review Process

**For each test file:**

1. **Read the test file completely**
2. **Identify what functionality it's supposed to test** (reference original task)
3. **Check against CLAUDE.md anti-patterns**:
   - Over-mocking core functionality?
   - Simulation instead of testing?
   - Mock data flow testing?
4. **Evaluate mock usage** against the "Mock Guidelines" section
5. **Verify project-specific patterns**:
   - API routes: Test with actual HTTP requests to real endpoints
   - Components: Test rendering and user interactions, not implementation details
   - Integration: Use test database, not mocked Prisma operations
   - Authentication: Mock Clerk (external), test your auth logic (internal)
6. **Check coverage alignment**: Ensure tests contribute to 80% minimum coverage requirement
7. **Document findings** with specific line references

### 5. Report Generation

Create a structured review report:

```markdown
## Test Review Report

### Files Reviewed

- [List test files and their purpose]

### Overall Assessment

- [PASS/NEEDS_IMPROVEMENT/MAJOR_ISSUES]

### Findings by Category

#### ✅ Good Practices Found

- [List positive examples with file:line references]

#### ❌ Anti-Patterns Detected

- [List violations of CLAUDE.md standards with file:line references]
- [Explain why each is problematic]

#### 🔧 Specific Recommendations

- [Concrete changes needed]
- [Reference CLAUDE.md sections for context]

### Priority Actions

1. [Most critical fixes first]
2. [Secondary improvements]
3. [Nice-to-have enhancements]
```

### 6. User Interaction

**Present findings**: Share the complete review report

**Ask for direction**: "Would you like me to:

1. Fix the identified issues automatically
2. Show you specific examples of better test implementations
3. Focus on the highest-priority issues first
4. Explain any of these findings in more detail"

**If user chooses fixes**: Proceed with implementing recommended changes, ensuring each fix follows CLAUDE.md guidelines.

## Decision Tree

**If no anti-patterns found**:

- Congratulate on good testing practices
- Suggest any minor improvements for edge cases or coverage

**If minor issues found**:

- Provide specific recommendations
- Offer to implement fixes
- Reference relevant CLAUDE.md sections

**If major issues found**:

- **STOP** and explain the severity
- Show specific examples of what's wrong
- **Recommend rewriting** problematic tests rather than patching
- Get user confirmation before proceeding with major changes

## Validation Checklist

Before completing review:

- [ ] All tests actually test the intended functionality
- [ ] Mocks are only used for external dependencies (Clerk, external APIs)
- [ ] No tests mock the method they're testing
- [ ] Real data flows through real business logic
- [ ] Edge cases use actual boundary conditions
- [ ] Error tests trigger real failure scenarios
- [ ] API route tests make real HTTP requests to actual endpoints
- [ ] Component tests use @testing-library/react patterns
- [ ] Integration tests use test database (not mocked Prisma)
- [ ] Tests follow Next.js 15 App Router patterns
- [ ] Tests contribute meaningfully to 80% coverage requirement
- [ ] Recommendations reference CLAUDE.md standards

## Recovery Procedures

**If tests are fundamentally flawed**:

1. Document what was learned about the testing approach
2. Explain why current tests provide false confidence
3. Propose rewrite strategy following CLAUDE.md guidelines
4. Get user approval before major rework

**If unclear what functionality should be tested**:

1. Reference the original coding task
2. Ask user to clarify testing objectives
3. Consult CLAUDE.md for testing scope guidance

## Notes

- Always reference current CLAUDE.md content, not cached knowledge
- Focus on testing actual functionality, not implementation details
- Prioritize user confidence in test quality over test quantity
- Remember: Passing tests that don't test real functionality are worse than no tests
