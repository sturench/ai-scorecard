# 🐕 Husky Git Hooks Configuration

This project uses [Husky](https://typicode.github.io/husky/) to enforce code quality and security through automated git hooks.

## 📋 Available Hooks

### Pre-commit Hook (`pre-commit`)

Runs before each commit to ensure code quality:

1. **🔐 Secrets Detection** - Scans staged files for API keys, tokens, and secrets
2. **🎨 Code Formatting** - Runs Prettier and ESLint on staged files via `lint-staged`
3. **🔍 Type Checking** - Validates TypeScript types with `tsc --noEmit`
4. **🧪 Unit Tests** - Runs Jest tests to catch regressions

**Fast Fail**: Stops at first failure to provide quick feedback.

### Pre-push Hook (`pre-push`)

Runs before pushing to ensure production readiness:

1. **🧪 Full Test Suite** - Runs complete test suite including integration tests
2. **📊 Coverage Check** - Validates test coverage meets minimum thresholds
3. **🏗️ Build Validation** - Ensures application builds successfully
4. **🔒 Security Audit** - Checks for known vulnerabilities with `npm audit`
5. **📝 Work Markers** - Warns about TODO/FIXME comments in staged changes
6. **📦 Dependency Sync** - Validates package-lock.json is up-to-date

### Commit Message Hook (`commit-msg`)

Validates commit message format using [Conventional Commits](https://conventionalcommits.org/):

- **Format**: `<type>(<scope>): <description>`
- **Valid Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Examples**:
  - ✅ `feat(auth): add user login functionality`
  - ✅ `fix(api): resolve null pointer exception`
  - ❌ `updated stuff`

### Prepare Commit Message Hook (`prepare-commit-msg`)

Auto-prefixes commit messages based on branch naming:

- `feat/user-auth` → `feat: ` prefix
- `fix/login-bug` → `fix: ` prefix
- `docs/readme` → `docs: ` prefix

### Post-checkout Hook (`post-checkout`)

Provides helpful reminders after branch switches:

- Suggests `npm install` if `package.json` changed
- Suggests database commands if Prisma schema changed

## 🚀 Quick Commands

```bash
# Test hook components manually
npm run hooks:test

# Check for secrets in staged files
npm run security:secrets

# Run security audit
npm run security:audit

# Format all files
npm run format

# Check formatting without fixing
npm run format:check
```

## 🛠️ Customization

### Adding New Secret Patterns

Edit `scripts/check-secrets.js` to add new secret detection patterns:

```javascript
const SECRET_PATTERNS = [
  { pattern: /your-pattern-here/, type: 'Your Secret Type' },
  // ... existing patterns
];
```

### Excluding Files from Checks

Update the `EXCLUDE_PATTERNS` array in `scripts/check-secrets.js`:

```javascript
const EXCLUDE_PATTERNS = [
  /your-exclude-pattern/,
  // ... existing patterns
];
```

### Modifying Commit Message Rules

Edit `.commitlintrc.json` to customize commit message validation rules.

### Adjusting Test Coverage Thresholds

Modify the coverage threshold in `.husky/pre-push`:

```bash
--coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## 🔧 Troubleshooting

### Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify -m "emergency fix"

# Skip pre-push hooks (NOT RECOMMENDED)
git push --no-verify
```

### Hook Permissions Issues

```bash
# Fix hook permissions
chmod +x .husky/*
```

### Dependencies Out of Sync

```bash
# Fix package-lock.json issues
rm package-lock.json node_modules -rf
npm install
```

## 📊 What Each Hook Prevents

| Issue                    | Pre-commit | Pre-push | Commit-msg |
| ------------------------ | ---------- | -------- | ---------- |
| Secrets in code          | ✅         |          |            |
| Formatting issues        | ✅         |          |            |
| TypeScript errors        | ✅         |          |            |
| Test failures            | ✅         | ✅       |            |
| Build failures           |            | ✅       |            |
| Security vulnerabilities |            | ✅       |            |
| Poor commit messages     |            |          | ✅         |
| Incomplete work          |            | ⚠️       |            |

## 🎯 Best Practices

1. **Write descriptive commit messages** that explain the "why" not just the "what"
2. **Keep commits atomic** - one logical change per commit
3. **Run tests locally** before committing to catch issues early
4. **Use conventional branch naming** for automatic commit message prefixing
5. **Don't bypass hooks** unless it's a true emergency
6. **Keep dependencies updated** to avoid security audit failures

## 🔄 Maintenance

Hooks are automatically updated when:

- Installing dependencies (`npm install` runs `husky` prepare script)
- Checking out branches with hook changes

Regular maintenance:

```bash
# Update hook dependencies
npm update husky lint-staged @commitlint/cli

# Audit hook configuration
npm run hooks:test
```
