# Claude Code Instructions

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

## Enforced Development Workflow

Use the enhanced smart workflow command that enforces all quality requirements:

```
/scorecard-workflow <context>
```

**Mandatory Requirements:**

- Each task MUST be implemented on its own feature branch
- Test-Driven Development (TDD) is MANDATORY (no exceptions without permission)
- Progress commits MUST be made at logical points (subtask completions minimum)
- Expert agents MUST be used for implementation and heavy lifting
- 80% test coverage threshold enforced
- All quality gates must pass before task completion

**Supported contexts:**

- `morning` - Daily standup workflow with task selection
- `continue` - Resume current task with proper validation
- `review` - Quality validation and merge preparation
- `planning` - Sprint planning with complexity analysis

## Test-Driven Development (TDD)

All new functionality MUST follow Test-Driven Development practices using the project-specific TDD workflow command:

```
/tdd-workflow-scorecard <task-id>
```

This command ensures:

- Real functionality testing (not mocked behavior)
- 80% coverage threshold compliance
- AI scorecard domain-specific test patterns
- Integration with Jest, React Testing Library, and Next.js 14
- Proper Red-Green-Refactor cycle enforcement

Critical testing requirements:

- NEVER mock the core functionality being tested
- Use realistic AI assessment data in tests
- Mock only external services (email, APIs, file operations)
- Test actual scoring calculations with real inputs
- Validate business logic outcomes, not mock calls

## Git Hooks & Quality Gates

- NEVER use --no-verify to bypass Husky hooks for commit and push without first presenting to the user an explanation of what is causing the failure and why it is ok to bypass
