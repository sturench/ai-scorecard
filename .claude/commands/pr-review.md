# GitHub Pull Request Review - Comprehensive Quality Assurance

To invoke this slash command:

```bash
/pr-review                    # Auto-detect current PR with standard review
/pr-review --quick           # Fast review focusing on critical issues only
/pr-review --thorough        # Comprehensive deep-dive review with all experts
/pr-review --all-experts     # Force all expert reviews regardless of file changes
/pr-review --pr-number=123   # Review specific PR by number
```

## Purpose

This command provides comprehensive, expert-driven pull request reviews integrated with GitHub, Task Master, and your established quality gates. It automatically selects relevant experts based on changed files, verifies CI status, runs quality checks, and posts structured GitHub review comments with specific suggestions.

## Parameters Processing

- **PR Detection**: Auto-detect current branch PR or use `--pr-number`
- **Review Depth**: `--quick` (critical only) | standard (default) | `--thorough` (comprehensive)
- **Expert Selection**: Smart detection based on file changes or `--all-experts` to force all
- **GitHub Integration**: Automatically posts structured review to PR

## Step 1: Pre-Flight Checks

### GitHub Integration Verification

```bash
# Check gh CLI availability and authentication
gh auth status
```

**If gh CLI not available or not authenticated**:

```
❌ GitHub CLI Required

This command requires GitHub CLI (gh) to be installed and authenticated.

Setup steps:
1. Install: https://cli.github.com/
2. Authenticate: gh auth login
3. Verify access: gh repo view

Please complete GitHub CLI setup and retry.
```

**⚠️ STOP - Cannot proceed without GitHub integration**

### PR Detection and Validation

```bash
# Auto-detect current PR or use specified number
if [[ -z "--pr-number" ]]; then
  PR_NUMBER=$(gh pr view --json number --jq '.number' 2>/dev/null)
  if [[ -z "$PR_NUMBER" ]]; then
    echo "❌ No PR found for current branch. Please specify --pr-number=XXX"
    exit 1
  fi
else
  PR_NUMBER="--pr-number value"
fi

# Validate PR exists and is reviewable
gh pr view $PR_NUMBER --json state,mergeable,title,author 2>/dev/null || {
  echo "❌ PR #$PR_NUMBER not found or inaccessible"
  exit 1
}
```

### CI Status Verification

```bash
# Check CI status before review
CI_STATUS=$(gh pr checks $PR_NUMBER --json state,conclusion --jq '.[] | select(.conclusion != null) | .conclusion' | sort -u)

if echo "$CI_STATUS" | grep -q "failure\|cancelled\|timed_out"; then
  echo "⚠️ CI checks failing. Should I proceed with review anyway? (y/n)"
  # Wait for user confirmation
fi
```

## Step 2: Change Analysis and Expert Selection

### Fetch PR Details

```bash
# Get PR information
PR_INFO=$(gh pr view $PR_NUMBER --json title,body,author,files,additions,deletions,changedFiles)
PR_TITLE=$(echo "$PR_INFO" | jq -r '.title')
PR_AUTHOR=$(echo "$PR_INFO" | jq -r '.author.login')
CHANGED_FILES=$(echo "$PR_INFO" | jq -r '.files[].path')
```

### Intelligent Expert Detection

Based on changed files, automatically select relevant experts:

```bash
# File pattern matching for expert selection
EXPERTS_NEEDED=()

# Frontend Expert Detection
if echo "$CHANGED_FILES" | grep -E "\.(tsx?|jsx?|css|scss)$|/components/|/pages/|/app/.*\.(tsx?|jsx?)$"; then
  EXPERTS_NEEDED+=("@frontend-specialist")
fi

# Backend Expert Detection
if echo "$CHANGED_FILES" | grep -E "/api/|\.prisma|/lib/.*\.(ts|js)$|/utils/.*\.(ts|js)$|schema\.|middleware\.|route\."; then
  EXPERTS_NEEDED+=("@backend-specialist")
fi

# Database/Infrastructure Detection
if echo "$CHANGED_FILES" | grep -E "\.prisma|schema\.|migration|docker|\.yml$|\.yaml$|\.json$.*config"; then
  EXPERTS_NEEDED+=("@devops-specialist")
fi

# Architecture Detection (major structural changes)
if echo "$PR_INFO" | jq -r '.changedFiles' | awk '{if ($1 > 15) print "major"}' | grep -q major; then
  EXPERTS_NEEDED+=("@architecture-advisor")
fi

# Testing Detection
if echo "$CHANGED_FILES" | grep -E "\.test\.|\.spec\.|__tests__/|jest\.|vitest\."; then
  EXPERTS_NEEDED+=("@quality-assurance-coordinator")
fi

# Documentation Detection
if echo "$CHANGED_FILES" | grep -E "\.md$|README|docs/|\.mdx$"; then
  EXPERTS_NEEDED+=("@doc-specialist")
fi

# Force all experts if requested
if [[ "$*" == *"--all-experts"* ]]; then
  EXPERTS_NEEDED=("@frontend-specialist" "@backend-specialist" "@devops-specialist" "@architecture-advisor" "@quality-assurance-coordinator" "@product-owner")
fi

# Fallback: Always include QA coordinator for quality gates
if [[ ${#EXPERTS_NEEDED[@]} -eq 0 ]]; then
  EXPERTS_NEEDED+=("@quality-assurance-coordinator")
fi
```

**Display detected experts and changes**:

```
🔍 PR #$PR_NUMBER Analysis: "$PR_TITLE"

📊 Change Summary:
- Files changed: $(echo "$PR_INFO" | jq -r '.changedFiles')
- Lines added: $(echo "$PR_INFO" | jq -r '.additions')
- Lines deleted: $(echo "$PR_INFO" | jq -r '.deletions')
- Author: $PR_AUTHOR

🧠 Selected Experts:
$(printf '%s\n' "${EXPERTS_NEEDED[@]}")

Proceeding with $(echo "$1" | grep -q "quick" && echo "quick" || echo "$1" | grep -q "thorough" && echo "thorough" || echo "standard") depth review...
```

## Step 3: Task Master Integration Check

```bash
# Check if PR relates to Task Master tasks
TASK_REFERENCES=$(echo "$PR_TITLE $PR_INFO" | grep -oE "(task|subtask)\s*[0-9]+(\.[0-9]+)?" | head -5)

if [[ -n "$TASK_REFERENCES" ]]; then
  echo "📋 Task Master Integration Detected:"
  for task_ref in $TASK_REFERENCES; do
    TASK_ID=$(echo "$task_ref" | grep -oE "[0-9]+(\.[0-9]+)?")
    echo "  - Checking $task_ref: $TASK_ID"

    # Get task status and details
    task-master show "$TASK_ID" 2>/dev/null || echo "    ⚠️ Task $TASK_ID not found in Task Master"
  done
fi
```

## Step 4: Local Quality Gate Verification

### Pre-Review Quality Checks

```bash
# Run essential quality checks before expert review
echo "🔧 Running Local Quality Gates..."

# TypeScript compilation
npm run typecheck 2>/dev/null && echo "✅ TypeScript: No compilation errors" || echo "❌ TypeScript: Compilation errors found"

# Linting check
npm run lint 2>/dev/null && echo "✅ ESLint: No linting errors" || echo "⚠️ ESLint: Issues found"

# Build verification
npm run build 2>/dev/null && echo "✅ Build: Successful" || echo "❌ Build: Failed"

# Test execution (if not already run in CI)
if [[ "$*" == *"--thorough"* ]]; then
  npm test 2>/dev/null && echo "✅ Tests: Passing" || echo "❌ Tests: Failures detected"
fi
```

## Step 5: Multi-Expert Review Orchestration

### Review Depth Configuration

```bash
REVIEW_DEPTH="standard"
[[ "$*" == *"--quick"* ]] && REVIEW_DEPTH="quick"
[[ "$*" == *"--thorough"* ]] && REVIEW_DEPTH="thorough"
```

### Expert Review Execution

For each selected expert, conduct focused review:

#### Frontend Specialist Review (@frontend-specialist)

```
## Frontend Expert Review - PR #$PR_NUMBER

**Review Scope**: UI/UX, React components, styling, client-side functionality
**Review Depth**: $REVIEW_DEPTH

### Component Architecture Assessment
- **Component Design**: Are components properly structured and reusable?
- **State Management**: Proper React state handling and data flow?
- **Performance**: Optimal rendering, proper memoization, bundle impact?
- **Accessibility**: WCAG compliance, semantic HTML, keyboard navigation?

### Next.js Integration Review
- **App Router Usage**: Proper server/client component boundaries?
- **Image Optimization**: Next.js Image component usage for media?
- **SEO**: Meta tags, structured data, proper head management?
- **Performance**: Core Web Vitals impact, loading optimization?

### Styling and Responsiveness
- **Tailwind Implementation**: Consistent design system usage?
- **Responsive Design**: Mobile-first approach, breakpoint handling?
- **Design Consistency**: Follows established UI patterns?
- **Dark Mode**: Compatibility with planned dark mode toggle?

### Critical Issues Found:
[List any blocking issues that prevent merge]

### Recommendations:
[Specific code improvements with line number references]

### Frontend Approval: [✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED]
```

#### Backend Specialist Review (@backend-specialist)

```
## Backend Expert Review - PR #$PR_NUMBER

**Review Scope**: API routes, database operations, server-side logic, security
**Review Depth**: $REVIEW_DEPTH

### API Design Assessment
- **RESTful Design**: Proper HTTP methods, status codes, response structure?
- **Error Handling**: Consistent error responses, proper exception handling?
- **Validation**: Input validation, Zod schema usage, data sanitization?
- **Authentication**: Proper Clerk integration, route protection?

### Database Operations Review
- **Prisma Usage**: Efficient queries, proper error handling, transactions?
- **Data Modeling**: Schema design, relationships, indexing strategy?
- **Performance**: Query optimization, N+1 prevention, connection pooling?
- **Migrations**: Safe schema changes, backward compatibility?

### Security Assessment
- **Input Validation**: SQL injection prevention, XSS protection?
- **Authentication**: Session management, token validation?
- **Authorization**: Proper role-based access control?
- **Data Protection**: Sensitive data handling, encryption at rest?

### Critical Issues Found:
[List any security or data integrity concerns]

### Recommendations:
[Specific backend improvements with security implications]

### Backend Approval: [✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED]
```

#### Quality Assurance Review (@quality-assurance-coordinator)

```
## QA Coordinator Review - PR #$PR_NUMBER

**Review Scope**: Testing methodology, quality gates, production readiness
**Review Depth**: $REVIEW_DEPTH

### Testing Methodology Assessment (Critical - per CLAUDE.md)
- **Anti-Pattern Compliance**: No over-mocking of core functionality?
- **Real Logic Testing**: Tests exercise actual business logic vs simulations?
- **Integration Testing**: Real database operations vs mocked Prisma calls?
- **Mock Usage**: Only external services mocked (Clerk, uploads), not internal logic?

### Test Coverage Analysis
- **Coverage Metrics**: Minimum 80% for new code, 100% for critical paths?
- **Test Quality**: Real scenarios vs manufactured test data?
- **Edge Cases**: Boundary conditions tested with actual data?
- **Performance Tests**: Load testing for search queries and large data sets?

### Production Readiness
- **Deployment Safety**: Can be safely rolled back if issues arise?
- **Environment Config**: No hardcoded values, proper environment variables?
- **Monitoring**: Adequate logging for debugging production issues?
- **Breaking Changes**: Impact analysis on existing features?

### Quality Gates Status
[✅/⚠️/❌] **Architecture**: System design integrity
[✅/⚠️/❌] **Functionality**: Feature completeness and correctness
[✅/⚠️/❌] **Security**: Vulnerability assessment passed
[✅/⚠️/❌] **Performance**: Meets <3s load, <1s search requirements
[✅/⚠️/❌] **Testing**: Proper methodology without anti-patterns
[✅/⚠️/❌] **User Experience**: Accessibility and usability validated

### Critical Issues Found:
[Any issues preventing production deployment]

### QA Approval: [✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED]
```

#### Architecture Advisor Review (@architecture-advisor) - If Major Changes

```
## Architecture Review - PR #$PR_NUMBER

**Review Scope**: System design, integration patterns, scalability impact
**Review Depth**: $REVIEW_DEPTH

### Architectural Impact Assessment
- **System Integrity**: Changes maintain overall system coherence?
- **Integration Patterns**: Follows established patterns and conventions?
- **Scalability**: Will work at planned user scale and data volume?
- **Technical Debt**: Any shortcuts that create future maintenance burden?

### Design Pattern Compliance
- **Next.js Patterns**: Proper App Router usage, server/client boundaries?
- **Database Patterns**: Efficient Prisma usage, proper relationship modeling?
- **Component Patterns**: Reusable, maintainable component architecture?
- **API Patterns**: Consistent endpoint design, proper error handling?

### Cross-System Impact
- **Breaking Changes**: Impact on other features or components?
- **Data Migration**: Safe schema changes, backward compatibility?
- **Performance Impact**: Effect on overall system performance?
- **Security Architecture**: Maintains security boundaries and controls?

### Architecture Approval: [✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED]
```

## Step 6: Review Synthesis and Decision Logic

### Blocking vs Non-Blocking Criteria

**Blocking Issues (❌ REJECTED)**:

- Security vulnerabilities or data exposure risks
- Breaking changes without proper migration path
- Test failures or critical functionality broken
- Performance regressions exceeding thresholds (<3s load, <1s search)
- Tests exhibiting anti-patterns (over-mocking core functionality)
- Authentication or authorization bypasses
- Data integrity risks or database corruption potential

**Non-Blocking Concerns (⚠️ CONDITIONAL)**:

- Code style inconsistencies (fixable with auto-formatting)
- Minor performance optimizations
- Missing non-critical test coverage
- Documentation updates needed
- Minor accessibility improvements
- Refactoring opportunities

### Decision Matrix

```bash
# Count expert approvals
APPROVED_COUNT=$(grep -c "✅ APPROVED" expert_reviews.tmp)
CONCERN_COUNT=$(grep -c "⚠️ CONCERNS" expert_reviews.tmp)
REJECTED_COUNT=$(grep -c "❌ REJECTED" expert_reviews.tmp)

# Determine overall status
if [[ $REJECTED_COUNT -gt 0 ]]; then
  OVERALL_STATUS="❌ REQUEST_CHANGES"
  GITHUB_ACTION="REQUEST_CHANGES"
elif [[ $CONCERN_COUNT -gt 0 ]]; then
  OVERALL_STATUS="⚠️ COMMENT"
  GITHUB_ACTION="COMMENT"
else
  OVERALL_STATUS="✅ APPROVE"
  GITHUB_ACTION="APPROVE"
fi
```

## Step 7: GitHub Review Posting

### Structured Review Comment Generation

```bash
# Generate comprehensive review comment
cat > pr_review.md << EOF
## 🔍 Expert Review Summary - PR #$PR_NUMBER

### Overall Assessment: $OVERALL_STATUS

**Review Configuration:**
- **Experts Engaged:** $(printf '%s ' "${EXPERTS_NEEDED[@]}")
- **Review Depth:** $REVIEW_DEPTH
- **Files Analyzed:** $(echo "$PR_INFO" | jq -r '.changedFiles') files
- **CI Status:** $(gh pr checks $PR_NUMBER --json conclusion --jq '.[] | select(.conclusion != null) | .conclusion' | sort -u | tr '\n' ' ')

### Expert Review Results
$(cat expert_reviews.tmp)

### 📋 Task Master Integration
$(if [[ -n "$TASK_REFERENCES" ]]; then
  echo "**Related Tasks:** $TASK_REFERENCES"
  for task_ref in $TASK_REFERENCES; do
    TASK_ID=$(echo "$task_ref" | grep -oE "[0-9]+(\.[0-9]+)?")
    echo "- Task $TASK_ID: $(task-master show "$TASK_ID" 2>/dev/null | head -1 || echo "Not found")"
  done
else
  echo "*No Task Master references detected*"
fi)

### 🚀 Deployment Recommendation

$(if [[ "$GITHUB_ACTION" == "APPROVE" ]]; then
  echo "✅ **READY FOR MERGE**"
  echo ""
  echo "All expert reviews passed. This PR meets quality standards and is safe to deploy."
  echo ""
  echo "**Next Steps:**"
  echo "1. Merge when ready"
  echo "2. Monitor deployment for any issues"
  echo "3. Update related Task Master tasks if applicable"
elif [[ "$GITHUB_ACTION" == "COMMENT" ]]; then
  echo "⚠️ **CONDITIONAL APPROVAL - Minor Issues**"
  echo ""
  echo "The code is functionally ready but has minor concerns that should be addressed:"
  echo ""
  echo "**Required Actions:**"
  grep "⚠️" expert_reviews.tmp | sed 's/^/- /'
  echo ""
  echo "**Options:**"
  echo "1. Address concerns before merge (recommended)"
  echo "2. Create follow-up issues for non-critical items"
  echo "3. Merge with team lead approval if concerns are minor"
else
  echo "❌ **CHANGES REQUIRED**"
  echo ""
  echo "Critical issues found that must be resolved before merge:"
  echo ""
  echo "**Blocking Issues:**"
  grep "❌" expert_reviews.tmp | sed 's/^/- /'
  echo ""
  echo "**Required Actions:**"
  echo "1. Address all critical issues listed above"
  echo "2. Re-run tests and quality checks"
  echo "3. Request new review after fixes"
fi)

### 🔧 Quality Gates Status
- **Build:** $(npm run build >/dev/null 2>&1 && echo "✅ Passed" || echo "❌ Failed")
- **TypeScript:** $(npm run typecheck >/dev/null 2>&1 && echo "✅ Passed" || echo "❌ Failed")
- **Linting:** $(npm run lint >/dev/null 2>&1 && echo "✅ Passed" || echo "⚠️ Issues")
- **Tests:** $(if [[ "$REVIEW_DEPTH" == "thorough" ]]; then npm test >/dev/null 2>&1 && echo "✅ Passed" || echo "❌ Failed"; else echo "🔄 Skipped (run with --thorough)"; fi)

---
*Generated by Claude Code PR Review System*
*Review conducted with: $(echo "${EXPERTS_NEEDED[@]}" | tr ' ' ', ') at $REVIEW_DEPTH depth*
EOF
```

### Post Review to GitHub

```bash
# Post the review using gh CLI
gh pr review $PR_NUMBER --$GITHUB_ACTION --body-file pr_review.md

echo ""
echo "✅ Review posted to GitHub PR #$PR_NUMBER"
echo "📄 Review status: $OVERALL_STATUS"
echo "🔗 View PR: $(gh pr view $PR_NUMBER --json url --jq '.url')"
```

## Step 8: Task Master Updates (If Applicable)

```bash
# Update Task Master with review results if tasks are referenced
if [[ -n "$TASK_REFERENCES" ]]; then
  for task_ref in $TASK_REFERENCES; do
    TASK_ID=$(echo "$task_ref" | grep -oE "[0-9]+(\.[0-9]+)?")

    if task-master show "$TASK_ID" >/dev/null 2>&1; then
      UPDATE_MSG="PR review completed: $OVERALL_STATUS

PR #$PR_NUMBER Expert Review Results:
$(echo "${EXPERTS_NEEDED[@]}" | tr ' ' ', ') conducted $REVIEW_DEPTH review

Review Status: $GITHUB_ACTION
$(if [[ "$GITHUB_ACTION" == "APPROVE" ]]; then echo "✅ Ready for merge and task completion"; elif [[ "$GITHUB_ACTION" == "COMMENT" ]]; then echo "⚠️ Minor concerns to address"; else echo "❌ Critical issues require fixes"; fi)

GitHub PR: $(gh pr view $PR_NUMBER --json url --jq '.url')"

      task-master update-subtask --id="$TASK_ID" --prompt="$UPDATE_MSG"
      echo "📋 Updated Task Master task $TASK_ID with review results"
    fi
  done
fi
```

## Step 9: Summary and Next Steps

```
🎉 PR Review Complete for #$PR_NUMBER

📊 **Review Summary:**
- **Experts:** $(echo "${EXPERTS_NEEDED[@]}" | tr ' ' ', ')
- **Decision:** $OVERALL_STATUS
- **GitHub Action:** $GITHUB_ACTION
- **Quality Gates:** $(npm run build >/dev/null 2>&1 && echo "Build ✅" || echo "Build ❌") $(npm run typecheck >/dev/null 2>&1 && echo "TS ✅" || echo "TS ❌")

🔗 **Links:**
- PR: $(gh pr view $PR_NUMBER --json url --jq '.url')
- CI Checks: $(gh pr view $PR_NUMBER --json url --jq '.url')/checks

$(if [[ "$GITHUB_ACTION" == "APPROVE" ]]; then
  echo "✅ **Ready to merge!** All quality gates passed."
elif [[ "$GITHUB_ACTION" == "COMMENT" ]]; then
  echo "⚠️ **Address minor concerns** then merge when ready."
else
  echo "❌ **Fix critical issues** before requesting re-review."
fi)

**Available Follow-up Commands:**
- \`/pr-review --pr-number=$PR_NUMBER --thorough\` - More comprehensive review
- \`/task-kickoff <task-id>\` - Start related task work
- \`/subtask-kickoff <subtask-id>\` - Work on specific subtask
```

## Error Handling and Fallbacks

### GitHub API Rate Limiting

```bash
if gh api rate_limit --jq '.rate.remaining' | awk '{if ($1 < 10) print "low"}' | grep -q low; then
  echo "⚠️ GitHub API rate limit low. Review may be slower."
  echo "Consider waiting or using --quick mode for essential checks only."
fi
```

### Expert Agent Failures

```bash
# If an expert agent fails, continue with available experts
if ! expert_review_function; then
  echo "⚠️ Expert review failed for $(expert). Continuing with available experts."
  echo "Consider manual review for this area."
fi
```

### Task Master Unavailable

```bash
if ! command -v task-master >/dev/null 2>&1; then
  echo "📋 Task Master not available - skipping task integration"
  echo "Task references found but cannot update: $TASK_REFERENCES"
fi
```

## Usage Examples

```bash
# Standard review for current PR
/pr-review

# Quick review focusing on critical issues
/pr-review --quick

# Comprehensive review with all experts
/pr-review --thorough --all-experts

# Review specific PR number
/pr-review --pr-number=156 --thorough

# Review PR with all experts regardless of file changes
/pr-review --pr-number=89 --all-experts
```

## Integration Notes

- **GitHub Integration**: Requires `gh` CLI installation and authentication
- **Expert System**: Leverages existing Claude Code agent architecture
- **Task Master**: Automatically updates related tasks with review outcomes
- **Quality Gates**: Integrates with existing testing and build pipeline
- **Professional Format**: Uses GitHub suggestion format for code improvements

This command provides enterprise-grade PR review capabilities while seamlessly integrating with your existing development workflow and quality assurance processes.
