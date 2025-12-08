# Testing Guide for ReefMetrics

This document provides comprehensive guidance on running and writing tests for the ReefMetrics project.

## Overview

The project uses a multi-layered testing approach:

- **Unit Tests**: Test individual functions and modules using Vitest
- **Integration Tests**: Validate service layer interactions using Vitest
- **E2E Tests**: Simulate real user flows using Playwright

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
# Run all unit and integration tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests in watch mode
npm run test:watch
```

## Unit & Integration Tests (Vitest)

### Running Unit Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Open interactive UI for tests
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Unit Tests

Tests should be placed in `src/__tests__/` directory with `.test.ts` or `.test.tsx` extension.

#### Basic Test Structure

```typescript
import { describe, it, expect } from "vitest";
import { calculateStatus } from "@/lib/utils/parameter-status";

describe("calculateStatus", () => {
  it("should return normal status for values in range", () => {
    const result = calculateStatus(1.025, 1.02, 1.03);
    expect(result.status).toBe("normal");
  });

  it("should return critical status for large deviations", () => {
    const result = calculateStatus(0.5, 1.0, 2.0);
    expect(result.status).toBe("critical");
  });
});
```

#### Testing React Components

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/components/__tests__/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
	it('should render correctly', () => {
		render(<MyComponent title="Test" />);
		expect(screen.getByText('Test')).toBeInTheDocument();
	});

	it('should handle user interactions', async () => {
		const { user } = render(<MyComponent />);
		await user.click(screen.getByRole('button'));
		expect(screen.getByText('Clicked')).toBeInTheDocument();
	});
});
```

### Best Practices for Unit Tests

1. **Use Descriptive Names**: Test names should clearly describe what is being tested

   ```typescript
   // Good
   it("should return critical status when deviation is 20% or more", () => {});

   // Bad
   it("should work", () => {});
   ```

2. **Follow AAA Pattern**: Arrange, Act, Assert

   ```typescript
   it("should calculate correct deviation", () => {
     // Arrange
     const currentValue = 0.9;
     const optimalMin = 1.0;

     // Act
     const deviation = calculateDeviation(currentValue, optimalMin, 1.1);

     // Assert
     expect(deviation).toBeCloseTo(10, 1);
   });
   ```

3. **Test Edge Cases**: Don't just test happy paths

   ```typescript
   it("should handle null values", () => {});
   it("should handle zero values", () => {});
   it("should handle negative values", () => {});
   it("should handle boundary conditions", () => {});
   ```

4. **Mock External Dependencies**: Use `vi.mock()` for external calls

   ```typescript
   import { vi } from "vitest";

   vi.mock("@supabase/supabase-js", () => ({
     createClient: vi.fn(() => ({
       auth: { getSession: vi.fn() },
     })),
   }));
   ```

5. **Use Fixtures for Reusable Data**: Define test data at the top
   ```typescript
   const mockAquarium = {
     id: "123",
     name: "Test Reef",
     type: "reef",
   };
   ```

### Coverage Reports

Coverage reports are generated in `coverage/` directory when running:

```bash
npm run test:coverage
```

Coverage thresholds are configured in `vitest.config.ts`:

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests matching pattern
npx playwright test -g "login"
```

### Writing E2E Tests

E2E tests are in `e2e/` directory with `.spec.ts` extension.

#### Basic E2E Test Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("User Authentication", () => {
  test("should login successfully", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill in credentials
    await page.fill('input[type="email"]', "user@example.com");
    await page.fill('input[type="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*aquariums/);
  });
});
```

#### Using Test Helpers

Use the provided helpers in `e2e/helpers.ts` for common operations:

```typescript
import { loginUser, createAquarium, testUsers } from "./helpers";

test("should create aquarium after login", async ({ page }) => {
  // Login using helper
  await loginUser(page, testUsers.validUser.email, testUsers.validUser.password);

  // Create aquarium using helper
  await createAquarium(page, {
    name: "My Reef",
    type: "Reef",
  });

  // Verify
  await expect(page.locator("text=My Reef")).toBeVisible();
});
```

### Best Practices for E2E Tests

1. **Use Meaningful Selectors**: Prefer data-testid attributes

   ```typescript
   // Good - explicit test attribute
   await page.click('[data-testid="submit-button"]');

   // Acceptable - role-based
   await page.click('button:has-text("Submit")');

   // Avoid - brittle XPath
   await page.click('//*[@id="form"]/div[1]/button');
   ```

2. **Wait for Elements**: Don't hardcode delays

   ```typescript
   // Good
   await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

   // Avoid
   await page.waitForTimeout(1000);
   ```

3. **Isolate Tests**: Each test should be independent

   ```typescript
   test.beforeEach(async ({ page }) => {
     // Setup before each test
     await loginUser(page, ...);
   });

   test.afterEach(async ({ page }) => {
     // Cleanup after each test
     await logoutUser(page);
   });
   ```

4. **Test User Flows**: Focus on complete workflows

   ```typescript
   test("should complete full aquarium setup flow", async ({ page }) => {
     // 1. Login
     // 2. Create aquarium
     // 3. Add measurements
     // 4. View recommendations
     // 5. Logout
   });
   ```

5. **Use Visual Comparisons**: Test visual appearance
   ```typescript
   await expect(page).toHaveScreenshot("dashboard-layout.png");
   ```

### Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:4321`
- **Browsers**: Chromium (Desktop)
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Traces**: Recorded on first retry for debugging

### Debugging E2E Tests

1. **UI Mode** - Interactive test runner:

   ```bash
   npm run test:e2e:ui
   ```

2. **Debug Mode** - Step through tests:

   ```bash
   npm run test:e2e:debug
   ```

3. **Trace Viewer** - Analyze failed tests:

   ```bash
   npx playwright show-trace trace.zip
   ```

4. **Screenshots**: Automatically captured on failure in `test-results/` directory

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Commits to main branch
- Before deployment

Configure in `.github/workflows/test.yml`

## Troubleshooting

### Vitest Issues

**Tests not running:**

```bash
# Clear Vitest cache
rm -rf node_modules/.vite
npm run test
```

**Import resolution errors:**

- Check `tsconfig.json` paths configuration
- Ensure `@/` prefix is used for imports from `src/`

### Playwright Issues

**Dev server not starting:**

```bash
# Ensure port 4321 is available
lsof -i :4321

# Or run server separately:
npm run dev  # in one terminal
npm run test:e2e  # in another
```

**Authentication timeout:**

- Increase timeout in `playwright.config.ts` `use.timeout`
- Check if login flow has changed

**Screenshots not updating:**

```bash
# Update baseline screenshots
npx playwright test --update-snapshots
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Continuous Improvement

- Review test coverage regularly
- Update tests when requirements change
- Remove flaky tests and improve stability
- Add tests for reported bugs
- Keep test dependencies up to date
