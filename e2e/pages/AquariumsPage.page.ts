import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { AquariumFormModalPage } from "./AquariumFormModal.page";

/**
 * Page Object Model for Aquariums Page
 * Handles interactions with the aquariums list page
 */
export class AquariumsPage extends BasePage {
  readonly addAquariumButton: Locator;
  readonly aquariumCards: Locator;
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // Child page objects
  readonly formModal: AquariumFormModalPage;

  constructor(page: Page) {
    super(page);

    // Page locators
    this.addAquariumButton = this.getByTestId("add-new-aquarium-button");
    this.aquariumCards = this.page.locator('[data-testid*="aquarium-card"]');
    this.pageTitle = this.page.locator("h1").filter({ hasText: "My Aquariums" });
    this.pageDescription = this.page.locator("p.text-muted-foreground");

    // Initialize child page objects
    this.formModal = new AquariumFormModalPage(page);
  }

  /**
   * Navigate to aquariums page
   */
  async navigate(): Promise<void> {
    await this.goto("/aquariums");
    await this.waitForPageLoad();
  }

  /**
   * Click the Add New Aquarium button
   * Waits for the modal to become visible after clicking
   */
  async clickAddAquarium(): Promise<void> {
    // Ensure button is fully interactive (React hydrated)
    await this.addAquariumButton.waitFor({ state: "visible" });
    await this.page.waitForLoadState("networkidle");
    await this.addAquariumButton.click();
    await this.formModal.waitForModalVisible();
  }

  /**
   * Open the aquarium creation modal
   */
  async openCreateModal(): Promise<AquariumFormModalPage> {
    await this.addAquariumButton.click();
    await this.formModal.waitForModalVisible();
    return this.formModal;
  }

  /**
   * Get count of aquarium cards displayed
   */
  async getAquariumCount(): Promise<number> {
    return await this.aquariumCards.count();
  }

  /**
   * Get aquarium card by name
   */
  getAquariumCardByName(name: string): Locator {
    return this.page.locator(`[data-testid*="aquarium-card"]:has-text("${name}")`);
  }

  /**
   * Check if aquarium exists by name
   */
  async hasAquarium(name: string): Promise<boolean> {
    const card = this.getAquariumCardByName(name);
    return await this.isVisible(card);
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.addAquariumButton).toBeVisible();
  }

  /**
   * Verify aquarium exists by calling the API endpoint
   */
  async verifyAquariumExists(name: string): Promise<void> {
    // Fetch aquariums from API endpoint
    const response = await this.page.request.get("/api/aquariums");

    if (!response.ok()) {
      throw new Error(`Failed to fetch aquariums from API: ${response.status()}`);
    }

    const data = await response.json() as { data: Array<{ name: string }> };
    const aquariumExists = data.data.some((aquarium) => aquarium.name === name);

    if (!aquariumExists) {
      throw new Error(`Aquarium with name "${name}" not found in API response`);
    }
  }

  /**
   * Create a new aquarium (complete flow from page)
   */
  async createNewAquarium(data: {
    name: string;
    typeId?: string;
    volume?: string | number;
    description?: string;
  }): Promise<void> {
    await this.openCreateModal();
    await this.formModal.createAquarium(data);
  }

  /**
   * Take a screenshot of the aquariums page
   */
  async takeScreenshot(name: string = "aquariums-page"): Promise<void> {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      animations: "disabled",
    });
  }
}

