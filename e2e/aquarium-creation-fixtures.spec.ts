import { test, expect } from "./fixtures";

/**
 * Simplified Aquarium Creation Test
 * Using custom fixtures for cleaner test code
 *
 * Demonstrates the complete test scenario:
 * 1. Press Add New Aquarium button
 * 2. Fill all placeholders in form
 * 3. Press Save Button
 */

test.describe("Aquarium Creation - Using Fixtures", () => {
  /**
   * Test: Complete aquarium creation flow (simplified with fixtures)
   */
  test("should create new aquarium through complete flow", async ({ aquariumsPage }) => {
    // ARRANGE
    const newAquarium = {
      name: "Fixture Test Reef",
      volume: "250",
      description: "Test aquarium created using fixtures",
    };

    // ACT - Step 1: Press Add New Aquarium button
    await aquariumsPage.clickAddAquarium();

    // ASSERT - Verify modal opened
    await aquariumsPage.formModal.verifyModalVisible("create");

    // ACT - Step 2: Fill all placeholders in form
    await aquariumsPage.formModal.fillCompleteForm(newAquarium);

    // ACT - Step 3: Press Save Button
    await aquariumsPage.formModal.submitAndWaitForSuccess();

    // ASSERT - Verify aquarium was created
    await aquariumsPage.verifyAquariumExists(newAquarium.name);
  });

  /**
   * Test: Quick creation using helper method
   */
  test("should create aquarium using helper method", async ({ aquariumsPage }) => {
    // ARRANGE
    const aquarium = {
      name: "Quick Create Tank",
      volume: "100",
    };

    // ACT - Complete flow in one method
    await aquariumsPage.createNewAquarium(aquarium);

    // ASSERT
    await aquariumsPage.verifyAquariumExists(aquarium.name);
  });

  /**
   * Test: Form field validation
   */
  test("should validate required fields", async ({ aquariumsPage }) => {
    // ACT
    await aquariumsPage.clickAddAquarium();

    // Try to submit without filling required fields
    await aquariumsPage.formModal.clickSave();

    // ASSERT - Modal should remain visible (validation failed)
    await expect(aquariumsPage.formModal.modal).toBeVisible();

    // Save button might be disabled or form shows errors
    const hasErrors = await aquariumsPage.formModal.modal.locator(".text-destructive").count();
    expect(hasErrors).toBeGreaterThan(0);
  });

  /**
   * Test: Cancel operation
   */
  test("should cancel aquarium creation", async ({ aquariumsPage, authenticatedPage }) => {
    // ARRANGE
    const initialCount = await aquariumsPage.getAquariumCount();

    // ACT
    await aquariumsPage.clickAddAquarium();
    await aquariumsPage.formModal.fillName("Cancelled Tank");

    // Press Escape to cancel
    await authenticatedPage.keyboard.press("Escape");

    // ASSERT
    await aquariumsPage.formModal.waitForModalHidden();

    // Verify count didn't change
    const finalCount = await aquariumsPage.getAquariumCount();
    expect(finalCount).toBe(initialCount);
  });

  /**
   * Test: Visual regression
   */
  test("should match aquariums page snapshot", async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveScreenshot("aquariums-list.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});

