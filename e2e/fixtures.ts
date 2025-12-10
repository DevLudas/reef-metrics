import { test as base, Page } from "@playwright/test";
import { AquariumsPage, LoginPage } from "./pages";
import { testUsers } from "./helpers";

/**
 * Custom test fixtures for Playwright
 * Provides authenticated contexts and page objects
 * Uses real API endpoints with data from migrated database
 */

type CustomFixtures = {
  authenticatedPage: Page;
  aquariumsPage: AquariumsPage;
  loginPage: LoginPage;
};

/**
 * Extended test with custom fixtures
 * Usage: import { test, expect } from './fixtures';
 */
export const test = base.extend<CustomFixtures>({
  /**
   * Fixture: Authenticated page
   * Provides a page that is already logged in
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.loginAndWaitForRedirect(
      testUsers.validUser.email,
      testUsers.validUser.password
    );

    await use(page);
  },

  /**
   * Fixture: Aquariums page (authenticated)
   * Provides AquariumsPage object already navigated and authenticated
   * Uses real API endpoints with seeded test data
   */
  aquariumsPage: async ({ authenticatedPage }, use) => {

    const aquariumsPage = new AquariumsPage(authenticatedPage);
    await aquariumsPage.navigate();
    await aquariumsPage.verifyPageLoaded();

    await use(aquariumsPage);
  },

  /**
   * Fixture: Login page
   * Provides LoginPage object
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

export { expect } from "@playwright/test";

