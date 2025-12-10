import { Page } from "@playwright/test";

/**
 * Test user fixtures for authentication tests
 */
export const testUsers = {
  validUser: {
    email: process.env.E2E_USERNAME || "e2e@reefmetrics.com",
    password: process.env.E2E_PASSWORD || "",
  },
  invalidUser: {
    email: "invalid@example.com",
    password: "wrongpassword",
  },
};

/**
 * Helper function to login a user
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard or home
  await page.waitForURL(/\/(dashboard|profile|aquariums)/);
}

/**
 * Helper function to logout a user
 */
export async function logoutUser(page: Page) {
  // Click on user menu if available
  const userMenu = page.locator('button[aria-label="User menu"]');
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.click('button:has-text("Logout")');
  }
  await page.waitForURL("/login");
}

/**
 * Helper function to check if page is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const userMenu = page.locator('button[aria-label="User menu"]');
  return userMenu.isVisible();
}

/**
 * Helper function to create an aquarium (assumes user is authenticated)
 */
export async function createAquarium(
  page: Page,
  data: { name: string; type?: string; volume?: string; description?: string }
) {
  // Click add aquarium button
  const addButton = page.getByTestId("add-new-aquarium-button");
  if (await addButton.isVisible()) {
    await addButton.click();
  } else {
    // Fallback to text-based selector
    await page.click('button:has-text("Add")');
  }

  // Wait for modal to appear
  await page.waitForSelector('[data-testid="aquarium-form-modal"]', { state: "visible" });

  // Fill form fields
  await page.getByTestId("aquarium-name-input").fill(data.name);

  // Select type (first available if not specified)
  await page.getByTestId("aquarium-type-select").click();
  await page.waitForSelector('[data-testid="aquarium-type-select-content"]', { state: "visible" });
  const firstType = page.locator('[data-testid="aquarium-type-select-content"] [role="option"]').first();
  await firstType.click();

  // Fill optional fields
  if (data.volume) {
    await page.getByTestId("aquarium-volume-input").fill(data.volume);
  }

  if (data.description) {
    await page.getByTestId("aquarium-description-input").fill(data.description);
  }

  // Submit form
  await page.getByTestId("save-aquarium-button").click();

  // Wait for modal to close
  await page.waitForSelector('[data-testid="aquarium-form-modal"]', { state: "hidden", timeout: 10000 });
}

/**
 * Helper to wait for API response
 */
export async function waitForApiResponse(page: Page, method: string, urlPattern: string | RegExp) {
  return page.waitForResponse((response) => {
    const matches =
      typeof urlPattern === "string" ? response.url().includes(urlPattern) : response.url().match(urlPattern);
    return matches && response.request().method() === method;
  });
}

/**
 * Helper to take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().split("T")[0];
  return page.screenshot({ path: `./e2e/screenshots/${timestamp}-${name}.png` });
}
