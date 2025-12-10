import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Login Page
 * Handles authentication and login interactions
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = this.page.locator('input[type="email"]');
    this.passwordInput = this.page.locator('input[type="password"]');
    this.submitButton = this.page.locator('button[type="submit"]');
    this.errorMessage = this.page.locator('[role="alert"], .text-destructive');
    this.registerLink = this.page.locator('a[href*="register"]');
    this.forgotPasswordLink = this.page.locator('a[href*="forgot-password"]');
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto("/login");
    await this.waitForPageLoad();
    // Wait for React to fully hydrate
    await this.page.waitForTimeout(1000);
  }

  /**
   * Fill login credentials
   */
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Click submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform login action
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.clickSubmit();
  }

  /**
   * Wait for successful login redirect
   */
  async waitForSuccessfulLogin(): Promise<void> {
    // Give time for navigation or error message to appear
    await this.page.waitForTimeout(1500);

    // Check if there's an error message (indicating failed login)
    const errorVisible = await this.isVisible(this.errorMessage);
    if (errorVisible) {
      const errorText = await this.errorMessage.textContent();
      throw new Error(`Login failed: ${errorText}`);
    }

    // Wait for successful redirect
    await this.waitForUrl(/\/(dashboard|profile|aquariums)/, 5000);
  }

  /**
   * Complete login flow with redirect wait
   */
  async loginAndWaitForRedirect(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.waitForSuccessfulLogin();
  }

  /**
   * Verify login page is displayed
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorDisplayed(expectedMessage?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();

    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }
}

