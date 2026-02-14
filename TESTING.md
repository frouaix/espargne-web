# Testing Guide

## Overview
This repository uses [Vitest](https://vitest.dev/) for unit testing, with React Testing Library for component tests.

## Running Tests

### Run all tests once
```bash
pnpm test run
```

### Run tests in watch mode
```bash
pnpm test
```

### Run tests with UI
```bash
pnpm run test:ui
```

### Run tests with coverage report
```bash
pnpm run test:coverage
```

## Test Structure

All tests are located in the `src/tests/` directory:
- `setup.ts` - Test environment setup
- `*.test.ts` - Unit tests for TypeScript modules
- `*.test.tsx` - Component tests for React components

## Writing Tests

### Basic Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '../lib/module';

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should do something specific', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });
  });
});
```

### Component Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Test Coverage

Run `pnpm run test:coverage` to generate a coverage report. The report will be available in:
- Console output (text summary)
- `coverage/index.html` (detailed HTML report)

## Current Test Status

The test infrastructure is now in place with initial tests for the `bigHelpers` module (18 tests). Additional test coverage for other modules needs to be added. The testing framework and conventions are established to facilitate adding comprehensive tests across the codebase.

## Adding New Tests

1. Create a new file in `src/tests/` with the naming pattern `*.test.ts` or `*.test.tsx`
2. Import the necessary testing utilities from vitest
3. Write your test cases following the existing patterns
4. Run tests to ensure they pass

## Best Practices

- Write descriptive test names that explain what is being tested
- Use `describe` blocks to group related tests
- Test edge cases and error conditions
- Keep tests focused and independent
- Use meaningful assertions
