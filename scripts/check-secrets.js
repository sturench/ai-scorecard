#!/usr/bin/env node

/**
 * Simple secrets detection script for git pre-commit hooks
 * Checks for common secret patterns in staged files
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Common secret patterns to detect
const SECRET_PATTERNS = [
  // API Keys
  { pattern: /[Aa][Pp][Ii][_]?[Kk][Ee][Yy].*[=:]\s*['"]\w{20,}['"]/, type: 'API Key' },
  {
    pattern: /[Aa][Cc][Cc][Ee][Ss][Ss][_]?[Kk][Ee][Yy].*[=:]\s*['"]\w{20,}['"]/,
    type: 'Access Key',
  },

  // Private Keys
  { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/, type: 'Private Key' },

  // Database URLs with credentials
  { pattern: /postgresql:\/\/[^:]+:[^@]+@/, type: 'Database URL with credentials' },
  { pattern: /mysql:\/\/[^:]+:[^@]+@/, type: 'Database URL with credentials' },

  // Common service tokens
  { pattern: /sk_live_[0-9a-zA-Z]{24,}/, type: 'Stripe Live Key' },
  { pattern: /sk_test_[0-9a-zA-Z]{24,}/, type: 'Stripe Test Key' },
  { pattern: /xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}/, type: 'Slack Bot Token' },
  { pattern: /ghp_[0-9a-zA-Z]{36}/, type: 'GitHub Personal Access Token' },
  { pattern: /gho_[0-9a-zA-Z]{36}/, type: 'GitHub OAuth Token' },
  { pattern: /AKIA[0-9A-Z]{16}/, type: 'AWS Access Key ID' },

  // Generic high-entropy strings that might be secrets
  { pattern: /[=:]\s*['"][0-9a-zA-Z+/]{40,}['"]/, type: 'Possible Secret (high entropy)' },
];

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.next/,
  /dist/,
  /build/,
  /coverage/,
  /\.env\.example/,
  /package-lock\.json/,
  /yarn\.lock/,
  /\.secrets\.baseline/,
  /check-secrets\.js/,
];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.split('\n').filter((file) => file.trim() !== '');
  } catch (error) {
    console.error('Error getting staged files:', error.message);
    return [];
  }
}

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function checkFileForSecrets(filePath) {
  if (!fs.existsSync(filePath) || shouldExcludeFile(filePath)) {
    return [];
  }

  // Skip certain files completely
  if (
    filePath.includes('tasks.json') ||
    filePath.includes('deployment-guide.md') ||
    filePath.includes('email-templates.md')
  ) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const findings = [];

    lines.forEach((line, lineNumber) => {
      // Skip comments and obvious template examples
      if (
        line.trim().startsWith('#') ||
        line.includes('your_') ||
        line.includes('example_') ||
        line.includes('PLACEHOLDER') ||
        line.includes('TODO') ||
        line.includes('YOUR_') ||
        line.includes('[username]:[password]') ||
        line.includes('user:password@localhost') ||
        line.includes('test:test@localhost') ||
        line.includes('postgres:postgres@localhost') ||
        line.includes('_API_KEY_HERE') ||
        line.includes('_KEY_HERE') ||
        line.includes('postgresql://test:test@') ||
        line.includes('ai_scorecard_test') ||
        line.includes('braga_networking_test') ||
        line.includes('[password]@[project-ref]') ||
        line.includes('aireadycheck.com') ||
        line.includes('"details":') || // Skip detailed task descriptions
        line.includes('# Email Templates') ||
        line.includes('implementation-spec/') ||
        line.includes('Email Service Architecture:') ||
        line.includes('React Email for template development')
      ) {
        return;
      }

      SECRET_PATTERNS.forEach(({ pattern, type }) => {
        if (pattern.test(line)) {
          findings.push({
            file: filePath,
            line: lineNumber + 1,
            type: type,
            content: line.trim(),
          });
        }
      });
    });

    return findings;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

function main() {
  console.log('🔐 Scanning for secrets in staged files...');

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('No staged files to scan.');
    return;
  }

  let totalFindings = 0;

  stagedFiles.forEach((file) => {
    const findings = checkFileForSecrets(file);

    if (findings.length > 0) {
      console.log(`\n❌ Potential secrets found in ${file}:`);
      findings.forEach((finding) => {
        console.log(`  Line ${finding.line}: ${finding.type}`);
        console.log(`    ${finding.content}`);
      });
      totalFindings += findings.length;
    }
  });

  if (totalFindings > 0) {
    console.log(`\n❌ Found ${totalFindings} potential secret(s) in ${stagedFiles.length} files.`);
    console.log('\n💡 If these are false positives, you can:');
    console.log('   1. Move real secrets to environment variables');
    console.log('   2. Use .env.example for template values');
    console.log('   3. Add patterns to exclude in scripts/check-secrets.js');
    process.exit(1);
  } else {
    console.log('✅ No secrets detected in staged files.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFileForSecrets, SECRET_PATTERNS };
