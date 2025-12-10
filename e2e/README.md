# Page Object Model (POM) Structure for E2E Tests

## Overview

This directory contains Page Object Model implementations for E2E testing with Playwright, following best practices and guidelines for maintainable, scalable test automation.

## Architecture

```
e2e/
├── pages/                          # Page Object Models
│   ├── BasePage.ts                # Base class with common functionality
│   ├── AquariumsPage.page.ts     # Aquariums list page
│   ├── AquariumFormModal.page.ts # Aquarium form modal
│   ├── LoginPage.page.ts         # Login page
│   └── index.ts                   # Barrel export
├── fixtures.ts                    # Custom Playwright fixtures
├── helpers.ts                     # Helper functions
├── aquarium-creation.spec.ts      # Main test suite
├── aquarium-creation-fixtures.spec.ts  # Simplified tests with fixtures
└── README.md                      # This file
```

## Playwright Best Practices Implementation

### ✅ Chromium/Desktop Chrome Configuration
- Configured in `playwright.config.ts` with only Chromium browser
- Uses Desktop Chrome device settings

### ✅ Browser Contexts for Isolation
- Each test runs in isolated browser context
- Fixtures provide clean authenticated contexts
- No test pollution between runs

### ✅ Page Object Model (POM)
- **BasePage**: Abstract base class with common functionality
- **AquariumsPage**: Main page for aquarium list
- **AquariumFormModal**: Modal for create/edit operations
- **LoginPage**: Authentication page
- Hierarchical structure with composition (AquariumsPage contains AquariumFormModal)

### ✅ Resilient Locators
- Primary: `data-testid` attributes for stability
- Fallback: Semantic locators (role, text) when needed
- Type-safe locator properties in page objects

### ✅ API Testing Integration
- Test suite includes API validation examples
- Verifies backend state after UI operations
- Uses Playwright's `request` fixture

### ✅ Visual Comparison
- Implements `expect(page).toHaveScreenshot()`
- Configured with `animations: "disabled"` for consistency
- Full-page screenshots for comprehensive validation

### ✅ Test Hooks (Setup/Teardown)
- `beforeEach`: Authentication and page navigation
- Custom fixtures: Automated setup for common scenarios
- Clean state for each test

### ✅ Specific Matchers
- `toBeVisible()`: Element visibility
- `toContainText()`: Text content validation
- `toHaveValue()`: Form field values
- `toBeGreaterThan()`: Numeric assertions
- `toHaveScreenshot()`: Visual regression

### ✅ Parallel Execution
- Configuration: `fullyParallel: true`
- Specific test suite: `test.describe.configure({ mode: "parallel" })`
- Worker configuration for CI/local environments

### ✅ Arrange-Act-Assert Pattern
- All tests follow clear AAA structure
- Comments mark each phase
- Assertions after each action for clear test progression

## Page Object Classes

### BasePage

Base class providing common functionality:

```typescript
// Common methods
- goto(url): Navigate to URL
- waitForPageLoad(): Wait for page load
- getByTestId(testId): Get element by data-testid
- waitForVisible(locator): Wait for element visibility
- isVisible(locator): Check visibility
- screenshot(name): Take screenshot
```

### AquariumsPage

Represents the aquariums list page:

```typescript
// Key methods
- navigate(): Go to /aquariums
- clickAddAquarium(): Click add button
- openCreateModal(): Open creation modal
- getAquariumCount(): Get number of aquariums
- hasAquarium(name): Check if aquarium exists
- verifyAquariumExists(name): Assert aquarium exists
- createNewAquarium(data): Complete creation flow
```

### AquariumFormModal

Handles the aquarium form modal:

```typescript
// Form interaction methods
- fillName(name): Fill name field
- selectTypeById(id): Select specific type
- selectFirstType(): Select first available type
- fillVolume(volume): Fill volume field
- fillDescription(desc): Fill description
- clickSave(): Submit form
- fillCompleteForm(data): Fill all fields
- createAquarium(data): Complete creation flow

// Validation methods
- verifyModalVisible(mode): Assert modal state
- verifyFormIsEmpty(): Assert clean form
- verifyFormValues(data): Assert field values
- getFieldError(field): Get validation error
```

### LoginPage

Authentication page object:

```typescript
// Methods
- navigate(): Go to /login
- fillCredentials(email, password): Fill login form
- clickSubmit(): Submit form
- login(email, password): Complete login
- loginAndWaitForRedirect(): Login with redirect wait
- verifyPageLoaded(): Assert page loaded
- verifyErrorDisplayed(msg): Assert error shown
```

## Custom Fixtures

Located in `fixtures.ts`, provides reusable test contexts:

### authenticatedPage
Pre-authenticated page ready for testing:
```typescript
test("my test", async ({ authenticatedPage }) => {
  // Already logged in
});
```

### aquariumsPage
AquariumsPage object, authenticated and navigated:
```typescript
test("my test", async ({ aquariumsPage }) => {
  // Already on /aquariums, authenticated
  await aquariumsPage.clickAddAquarium();
});
```

### loginPage
LoginPage object ready to use:
```typescript
test("my test", async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.login(email, password);
});
```

## Test Scenarios

### Main Test: aquarium-creation.spec.ts

Comprehensive test suite with:
- Complete creation flow (3-step scenario)
- Minimal required fields test
- Form validation tests
- Cancel operation test
- Visual regression tests
- API validation test
- Parallel execution examples

### Simplified Test: aquarium-creation-fixtures.spec.ts

Uses custom fixtures for cleaner code:
- Same scenarios, less boilerplate
- Focus on test logic, not setup
- Demonstrates fixture usage

## Usage Examples

### Basic Test (Without Fixtures)

```typescript
import { test, expect } from "@playwright/test";
import { AquariumsPage, LoginPage } from "./pages";

test("create aquarium", async ({ page }) => {
  // ARRANGE
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.loginAndWaitForRedirect(email, password);
  
  const aquariumsPage = new AquariumsPage(page);
  await aquariumsPage.navigate();
  
  // ACT
  await aquariumsPage.createNewAquarium({
    name: "Test Tank",
    volume: "100"
  });
  
  // ASSERT
  await aquariumsPage.verifyAquariumExists("Test Tank");
});
```

### Simplified Test (With Fixtures)

```typescript
import { test, expect } from "./fixtures";

test("create aquarium", async ({ aquariumsPage }) => {
  // ARRANGE - Already authenticated and on page
  
  // ACT
  await aquariumsPage.createNewAquarium({
    name: "Test Tank",
    volume: "100"
  });
  
  // ASSERT
  await aquariumsPage.verifyAquariumExists("Test Tank");
});
```

### Visual Regression Test

```typescript
test("visual snapshot", async ({ aquariumsPage, authenticatedPage }) => {
  await expect(authenticatedPage).toHaveScreenshot("page.png", {
    fullPage: true,
    animations: "disabled"
  });
});
```

### API Validation Test

```typescript
test("verify via API", async ({ aquariumsPage, request }) => {
  // Create through UI
  await aquariumsPage.createNewAquarium({ name: "API Test" });
  
  // Verify through API
  const response = await request.get("/api/aquariums");
  const data = await response.json();
  
  expect(data.data.some(a => a.name === "API Test")).toBeTruthy();
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test aquarium-creation.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test by name
npx playwright test -g "should create new aquarium"

# Generate test code
npx playwright codegen http://localhost:3000

# View test report
npx playwright show-report

# View trace for debugging
npx playwright show-trace trace.zip
```

## Debugging

### Trace Viewer
Configured to capture traces on first retry:
```bash
npx playwright show-trace trace.zip
```

### UI Mode
Best for development:
```bash
npx playwright test --ui
```

### Debug Mode
Step through tests:
```bash
npx playwright test --debug
```

## Best Practices

1. **Use data-testid**: Most reliable locator strategy
2. **Page Object Methods**: One action per method
3. **Arrange-Act-Assert**: Clear test structure
4. **Custom Fixtures**: Reduce boilerplate
5. **Visual Tests**: Catch UI regressions
6. **API Validation**: Verify backend state
7. **Parallel Safe**: Tests should not depend on each other
8. **Error Messages**: Use descriptive expect messages
9. **Timeouts**: Use appropriate waits
10. **Clean State**: Each test starts fresh

## Data-TestID Reference

All interactive elements have `data-testid` attributes:

| Element | data-testid |
|---------|-------------|
| Add Aquarium Button | `add-new-aquarium-button` |
| Form Modal | `aquarium-form-modal` |
| Form | `aquarium-form` |
| Name Input | `aquarium-name-input` |
| Type Select | `aquarium-type-select` |
| Type Select Content | `aquarium-type-select-content` |
| Type Option | `aquarium-type-option-{id}` |
| Volume Input | `aquarium-volume-input` |
| Description Input | `aquarium-description-input` |
| Save Button | `save-aquarium-button` |

## Contributing

When adding new pages:

1. Create new page class extending `BasePage`
2. Define locators as readonly properties
3. Implement action methods (click, fill, etc.)
4. Implement verification methods (verify, assert)
5. Add to `pages/index.ts` exports
6. Create corresponding test file
7. Update this README

## Future Enhancements

- [ ] Add more page objects (Dashboard, Profile, etc.)
- [ ] Implement custom matchers for domain-specific assertions
- [ ] Add performance testing with Lighthouse
- [ ] Implement accessibility testing with axe-core
- [ ] Add mobile device testing configurations
- [ ] Create test data factories
- [ ] Implement API mocking for edge cases

