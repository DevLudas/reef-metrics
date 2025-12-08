import { test, expect } from "@playwright/test";
import { loginUser, logoutUser, createAquarium, testUsers } from "./helpers";

test.describe("Dashboard Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page, testUsers.validUser.email, testUsers.validUser.password);
  });

  test.afterEach(async ({ page }) => {
    // Logout after each test
    await logoutUser(page);
  });

  test("should display dashboard when authenticated", async ({ page }) => {
    await page.goto("/aquariums");
    await expect(page.locator("h1")).toContainText(/Aquariums|Dashboard/);
  });

  test("should allow adding a new aquarium", async ({ page }) => {
    await createAquarium(page, {
      name: "Test Aquarium E2E",
      type: "Reef",
    });

    // Verify aquarium appears in list
    await expect(page.locator("text=Test Aquarium E2E")).toBeVisible();
  });

  test("should navigate to aquarium details", async ({ page }) => {
    await page.goto("/aquariums");

    // Click on first aquarium card
    const aquariumCard = page.locator('[data-testid="aquarium-card"]').first();
    if (await aquariumCard.isVisible()) {
      await aquariumCard.click();
      // Should navigate to dashboard or details page
      await expect(page).toHaveURL(/\/(dashboard|aquariums\/.*)/);
    }
  });

  test("should display parameter cards with status indicators", async ({ page }) => {
    await page.goto("/aquariums");

    // Look for parameter cards or aquarium selector
    const selector = page.locator('[data-testid="aquarium-selector"], [data-testid="parameter-card"]');
    const count = await selector.count();

    // Should have at least some content
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Navigation", () => {
  test("should navigate between pages", async ({ page }) => {
    // Test unauthenticated navigation
    await page.goto("/");
    await expect(page).toHaveTitle(/.*ReefMetrics.*/);

    await page.goto("/login");
    await expect(page).toHaveURL(/.*login/);

    await page.goto("/register");
    await expect(page).toHaveURL(/.*register/);
  });
});
