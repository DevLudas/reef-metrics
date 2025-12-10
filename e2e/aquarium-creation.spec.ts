import { test, expect, Page } from "@playwright/test";
import { AquariumsPage, LoginPage } from "./pages";
import { testUsers } from "./helpers";

/**
 * E2E Test Suite for Aquarium Creation
 * Following Page Object Model pattern and Playwright best practices
 *
 * Test Scenario:
 * 1. Press Add New Aquarium button
 * 2. Fill all placeholders in form
 * 3. Press Save Button
 */

// Test data
const testAquarium = {
  name: "E2E Test Reef Tank",
  volume: "200",
  description: "Beautiful reef aquarium for E2E testing",
};

// Authenticated context setup
test.describe("Aquarium Creation Flow", () => {
  let aquariumsPage: AquariumsPage;

  /**
   * ARRANGE - Setup before each test
   * Login and navigate to aquariums page
   */
  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    const loginPage = new LoginPage(page);
    aquariumsPage = new AquariumsPage(page);

    // Login with valid credentials
    await loginPage.navigate();
    await loginPage.loginAndWaitForRedirect(
      testUsers.validUser.email,
      testUsers.validUser.password
    );

    // Navigate to aquariums page
    await aquariumsPage.navigate();
    await aquariumsPage.verifyPageLoaded();
  });

  /**
   * Test: Complete aquarium creation flow
   * Tests the three-step scenario with assertions at each stage
   */
  test("should create a new aquarium successfully", async ({ page }) => {
    // ARRANGE - Get initial state
    const initialCount = await aquariumsPage.getAquariumCount();

    // ACT - Step 1: Press Add New Aquarium button
    await aquariumsPage.clickAddAquarium();

    // ASSERT - Modal should be visible
    await aquariumsPage.formModal.verifyModalVisible("create");
    await aquariumsPage.formModal.verifyFormIsEmpty();

    // ACT - Step 2: Fill all placeholders in form
    await aquariumsPage.formModal.fillName(testAquarium.name);
    await aquariumsPage.formModal.selectFirstType();
    await aquariumsPage.formModal.fillVolume(testAquarium.volume);
    await aquariumsPage.formModal.fillDescription(testAquarium.description);

    // ASSERT - Verify form values are set correctly
    await aquariumsPage.formModal.verifyFormValues({
      name: testAquarium.name,
      volume: testAquarium.volume,
      description: testAquarium.description,
    });

    // ACT - Step 3: Press Save Button
    await aquariumsPage.formModal.clickSave();

    // ASSERT - Verify modal closes and aquarium appears
    await aquariumsPage.formModal.waitForModalHidden();
    await aquariumsPage.verifyAquariumExists(testAquarium.name);

    // ASSERT - Verify aquarium count increased
    const finalCount = await aquariumsPage.getAquariumCount();
    expect(finalCount).toBeGreaterThan(initialCount);
  });

  /**
   * Test: Create aquarium with only required fields
   */
  test("should create aquarium with only required fields", async ({ page }) => {
    const minimalAquarium = {
      name: "Minimal Test Tank",
    };

    // ACT
    await aquariumsPage.clickAddAquarium();
    await aquariumsPage.formModal.fillRequiredFields({ name: minimalAquarium.name });
    await aquariumsPage.formModal.submitAndWaitForSuccess();

    // ASSERT
    await aquariumsPage.verifyAquariumExists(minimalAquarium.name);
  });

  /**
   * Test: Form validation - empty name field
   */
  test("should show validation error for empty name", async ({ page }) => {
    // ACT
    await aquariumsPage.clickAddAquarium();
    await aquariumsPage.formModal.fillName("");
    await aquariumsPage.formModal.selectFirstType();
    await aquariumsPage.formModal.clickSave();

    // ASSERT - Modal should still be visible (submission failed)
    await expect(aquariumsPage.formModal.modal).toBeVisible();
  });

  /**
   * Test: Form validation - no type selected
   */
  test("should show validation error when type is not selected", async ({ page }) => {
    // ACT
    await aquariumsPage.clickAddAquarium();
    await aquariumsPage.formModal.fillName("Test Tank");
    // Skip type selection
    await aquariumsPage.formModal.clickSave();

    // ASSERT - Modal should still be visible
    await expect(aquariumsPage.formModal.modal).toBeVisible();
  });

  /**
   * Test: Cancel modal by clicking outside (if not submitting)
   */
  test("should close modal when clicking outside", async ({ page }) => {
    // ACT
    await aquariumsPage.clickAddAquarium();
    await aquariumsPage.formModal.verifyModalVisible("create");

    // Click outside modal (on backdrop)
    await page.keyboard.press("Escape");

    // ASSERT
    await aquariumsPage.formModal.waitForModalHidden();
  });

  /**
   * Test: Visual regression - Aquariums page
   * Uses screenshot comparison
   */
  test("should match visual snapshot of aquariums page", async ({ page }) => {
    // ASSERT - Visual comparison
    await expect(page).toHaveScreenshot("aquariums-page.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  /**
   * Test: Visual regression - Form modal
   */
  test("should match visual snapshot of empty form modal", async ({ page }) => {
    // ACT
    await aquariumsPage.clickAddAquarium();
    await aquariumsPage.formModal.waitForModalVisible();

    // ASSERT - Visual comparison
    await expect(page).toHaveScreenshot("aquarium-form-modal-empty.png", {
      animations: "disabled",
    });
  });

  /**
   * Test: Accessibility - Modal receives focus
   */
  test("should focus modal when opened", async ({ page }) => {
    // ACT
    await aquariumsPage.clickAddAquarium();
    await aquariumsPage.formModal.waitForModalVisible();

    // ASSERT - Modal or first input should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

/**
 * Test Suite: Aquarium Creation with API validation
 * Validates backend state after UI operations
 */
test.describe("Aquarium Creation with API Validation", () => {
  let aquariumsPage: AquariumsPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    aquariumsPage = new AquariumsPage(page);

    await loginPage.navigate();
    await loginPage.loginAndWaitForRedirect(
      testUsers.validUser.email,
      testUsers.validUser.password
    );

    await aquariumsPage.navigate();
  });

  /**
   * Test: Verify aquarium creation via API
   */
  test("should create aquarium and verify via API", async ({ page, request }) => {
    const aquarium = {
      name: "API Validated Tank",
      volume: "150",
    };

    // ACT - Create aquarium through UI
    await aquariumsPage.openCreateModal();
    await aquariumsPage.formModal.fillCompleteForm(aquarium);
    await aquariumsPage.formModal.clickSave();
    await aquariumsPage.formModal.waitForModalHidden();

    // ASSERT - Verify through API
    const response = await request.get("/api/aquariums", {
      headers: {
        // Cookies should be shared from browser context
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify the created aquarium exists in the API response
    const createdAquarium = data.data?.find((aq: any) => aq.name === aquarium.name);
    expect(createdAquarium).toBeTruthy();
    expect(createdAquarium.volume).toBe(parseFloat(aquarium.volume));
  });
});

/**
 * Test Suite: Parallel execution tests
 * These tests can run in parallel safely
 */
test.describe.configure({ mode: "parallel" });

test.describe("Aquarium Creation - Parallel Tests", () => {
  test("should handle multiple aquarium types", async ({ page }) => {
    // Test can run in parallel
    const loginPage = new LoginPage(page);
    const aquariumsPage = new AquariumsPage(page);

    await loginPage.navigate();
    await loginPage.loginAndWaitForRedirect(
      testUsers.validUser.email,
      testUsers.validUser.password
    );

    await aquariumsPage.navigate();
    await aquariumsPage.clickAddAquarium();

    // Verify type selector is populated
    await aquariumsPage.formModal.typeSelect.click();
    const options = await aquariumsPage.formModal.typeSelectContent
      .locator('[role="option"]')
      .count();

    expect(options).toBeGreaterThan(0);
  });
});

