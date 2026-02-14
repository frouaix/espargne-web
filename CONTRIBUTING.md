# Contributing to Espargne

Thank you for your interest in contributing to Espargne! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Working with Copilot Agent](#working-with-copilot-agent)

## Code of Conduct

This project follows standard open-source community guidelines:
- Be respectful and inclusive
- Focus on constructive feedback
- Prioritize collaboration over ego
- Help others learn and grow

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm package manager (10.x)
- Git for version control

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/frouaix/espargne-web.git
cd espargne-web

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
```

The development server will be available at `http://localhost:5174`.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### 2. Make Changes

- Follow the coding standards (see below)
- Write tests for new functionality
- Update documentation as needed
- Keep commits small and focused

### 3. Test Your Changes

```bash
# Run linter
pnpm lint

# Run type check
pnpm build  # Includes type checking

# Run tests
pnpm test run

# Generate coverage report
pnpm test:coverage
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: Add Monte Carlo simulation variance control"
# or
git commit -m "fix: Correct RMD calculation for age 73-75"
# or
git commit -m "docs: Update withdrawal strategy documentation"
```

Commit message prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style/formatting
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript Conventions

See `.github/instructions/CodingConventions.instructions.md` for detailed rules. Key points:

- **Always use semicolons** (`;`)
- **Use explicit return types** for functions
- **Prefer destructuring** over direct property access
- **No console.log** in production code
- **No inline CSS** - use CSS Modules or styled components

### Financial Calculations

**CRITICAL**: Always use Big.js for monetary values:

```typescript
// ✅ Correct
import { toBig, multiply } from '../lib/bigHelpers';
const balance = toBig(100000);
const growth = multiply(balance, 0.05);

// ❌ Wrong - Floating-point errors
const balance = 100000;
const growth = balance * 0.05;
```

### Component Patterns

Follow established patterns (see `.github/copilot-instructions.md`):
- Form visibility toggle pattern
- localStorage persistence pattern
- Account type discrimination
- Form callback pattern

## Testing Guidelines

### Test Coverage Requirements

- **Minimum 80% overall coverage**
- **100% coverage for critical paths**:
  - Tax calculations
  - RMD calculations
  - Withdrawal coordination
  - Big.js helpers

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { toBig, multiply } from '../lib/bigHelpers';

describe('Financial Calculation', () => {
  it('should calculate correct balance growth', () => {
    const balance = toBig(100000);
    const rate = toBig(0.05);
    const growth = multiply(balance, rate);
    
    expect(growth.toString()).toBe('5000.00');
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test run

# Watch mode
pnpm test

# UI mode
pnpm test:ui

# Coverage report
pnpm test:coverage
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass (`pnpm test run`)
2. ✅ Linter passes (`pnpm lint`)
3. ✅ Build succeeds (`pnpm build`)
4. ✅ Coverage maintained or improved
5. ✅ Documentation updated if needed
6. ✅ No console.log statements in code
7. ✅ Git history is clean (squash if needed)

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Testing

## Testing
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project conventions
- [ ] No console.log statements
- [ ] Big.js used for all financial calculations
- [ ] Documentation updated
- [ ] Tests pass
- [ ] Build succeeds
```

### Review Process

1. **Automated Checks**: CI workflow runs automatically
2. **Code Review**: Maintainer reviews code quality and approach
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, PR will be merged
5. **Deployment**: Changes deploy automatically via GitHub Pages

### Review Expectations

- Respond to feedback within 48 hours
- Be open to suggestions and improvements
- Explain your approach if asked
- Update PR based on feedback

## Working with Copilot Agent

This repository is configured for GitHub Copilot coding agent. See `.github/agents.md` for agent-specific guidelines.

### Agent Personas

- `@test-agent` - Testing tasks
- `@docs-agent` - Documentation updates
- `@build-agent` - Build/deployment configuration
- `@code-agent` - General development (default)

### Assigning Issues to Copilot

When creating issues for Copilot agent:

1. **Be specific**: Clear goal, acceptance criteria, affected files
2. **Set boundaries**: What should/shouldn't be changed
3. **Provide context**: Link to related issues or docs
4. **Start small**: Well-scoped tasks work best

Example:
```markdown
## Task
Add validation for Social Security claiming age

## Acceptance Criteria
- Validate age is between 62-70
- Show error message for invalid ages
- Update tests to cover validation

## Files to Modify
- src/components/SSAIncomeForm.tsx
- src/tests/integration/SSAIncomeForm.test.tsx

## Constraints
- Use existing form validation pattern
- Don't modify SSA calculation logic
- Include unit tests
```

## Getting Help

- **Documentation**: See `.github/copilot-instructions.md`
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Questions**: Start a GitHub Discussion
- **Security**: Email security concerns privately

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Espargne! 🎉
