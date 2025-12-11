import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Aquarium Form Modal
 * Handles all interactions with the aquarium creation/edit form
 */
export class AquariumFormModalPage extends BasePage {
  // Modal elements
  readonly modal: Locator;
  readonly modalTitle: Locator;

  // Form elements
  readonly form: Locator;
  readonly nameInput: Locator;
  readonly typeSelect: Locator;
  readonly typeSelectContent: Locator;
  readonly volumeInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    // Modal locators
    this.modal = this.getByTestId("aquarium-form-modal");
    this.modalTitle = this.modal.locator("h2");

    // Form locators
    this.form = this.getByTestId("aquarium-form");
    this.nameInput = this.getByTestId("aquarium-name-input");
    this.typeSelect = this.getByTestId("aquarium-type-select");
    this.typeSelectContent = this.getByTestId("aquarium-type-select-content");
    this.volumeInput = this.getByTestId("aquarium-volume-input");
    this.descriptionInput = this.getByTestId("aquarium-description-input");
    this.saveButton = this.getByTestId("save-aquarium-button");
  }

  /**
   * Wait for modal to be visible
   */
  async waitForModalVisible(): Promise<void> {
    await this.waitForVisible(this.modal);
  }

  /**
   * Wait for modal to be hidden
   */
  async waitForModalHidden(): Promise<void> {
    await this.waitForHidden(this.modal);
  }

  /**
   * Check if modal is in create mode
   */
  async isCreateMode(): Promise<boolean> {
    const title = await this.modalTitle.textContent();
    return title?.includes("Add New Aquarium") ?? false;
  }

  /**
   * Check if modal is in edit mode
   */
  async isEditMode(): Promise<boolean> {
    const title = await this.modalTitle.textContent();
    return title?.includes("Edit Aquarium") ?? false;
  }

  /**
   * Fill the name field
   */
  async fillName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  /**
   * Select aquarium type by ID
   */
  async selectTypeById(typeId: string): Promise<void> {
    await this.typeSelect.click();
    await this.waitForVisible(this.typeSelectContent);
    await this.getByTestId(`aquarium-type-option-${typeId}`).click();
  }

  /**
   * Select first available aquarium type
   */
  async selectFirstType(): Promise<void> {
    await this.typeSelect.click();

    // Wait for the dropdown content to be visible
    await this.waitForVisible(this.typeSelectContent);

    // Wait for select items to be rendered (with data-slot="select-item" from Radix UI)
    // This ensures the API has returned aquarium types before we try to interact
    const firstItem = this.page.locator('[data-slot="select-item"]').first();
    await firstItem.waitFor({ state: "attached", timeout: 10000 });
    await firstItem.click();
  }

  /**
   * Fill the volume field
   */
  async fillVolume(volume: string | number): Promise<void> {
    await this.volumeInput.clear();
    await this.volumeInput.fill(volume.toString());
  }

  /**
   * Fill the description field
   */
  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(description);
  }

  /**
   * Click the save button
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Check if save button is disabled
   */
  async isSaveButtonDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  /**
   * Check if form is submitting (save button shows loading state)
   */
  async isSubmitting(): Promise<boolean> {
    const buttonText = await this.saveButton.textContent();
    return buttonText?.includes("Saving...") ?? false;
  }

  /**
   * Fill all required fields
   */
  async fillRequiredFields(data: { name: string; typeId?: string }): Promise<void> {
    await this.fillName(data.name);

    if (data.typeId) {
      await this.selectTypeById(data.typeId);
    } else {
      await this.selectFirstType();
    }
  }

  /**
   * Fill complete form with all fields
   */
  async fillCompleteForm(data: {
    name: string;
    typeId?: string;
    volume?: string | number;
    description?: string;
  }): Promise<void> {
    // Fill required fields
    await this.fillRequiredFields({ name: data.name, typeId: data.typeId });

    // Fill optional fields if provided
    if (data.volume !== undefined) {
      await this.fillVolume(data.volume);
    }

    if (data.description) {
      await this.fillDescription(data.description);
    }
  }

  /**
   * Submit the form and wait for success
   * Waits for the modal to close AND the page to reload with new data
   */
  async submitAndWaitForSuccess(): Promise<void> {
    await this.clickSave();
    await this.waitForModalHidden();
    // Account for 500ms delay in AddAquariumButton before reload triggers
    // Then wait for navigation and network activity to complete
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Wait for page to load and any data requests to finish
    await this.page.waitForLoadState("networkidle", { timeout: 10000 });
  }

  /**
   * Create a new aquarium (complete flow)
   */
  async createAquarium(data: {
    name: string;
    typeId?: string;
    volume?: string | number;
    description?: string;
  }): Promise<void> {
    await this.waitForModalVisible();
    await this.fillCompleteForm(data);
    await this.submitAndWaitForSuccess();
  }

  /**
   * Verify modal is visible with correct title
   */
  async verifyModalVisible(mode: "create" | "edit"): Promise<void> {
    await expect(this.modal).toBeVisible();

    if (mode === "create") {
      await expect(this.modalTitle).toContainText("Add New Aquarium");
    } else {
      await expect(this.modalTitle).toContainText("Edit Aquarium");
    }
  }

  /**
   * Verify form fields are empty (for create mode)
   */
  async verifyFormIsEmpty(): Promise<void> {
    await expect(this.nameInput).toHaveValue("");
    await expect(this.volumeInput).toHaveValue("");
    await expect(this.descriptionInput).toHaveValue("");
  }

  /**
   * Verify form fields contain specific values
   */
  async verifyFormValues(data: { name?: string; volume?: string; description?: string }): Promise<void> {
    if (data.name !== undefined) {
      await expect(this.nameInput).toHaveValue(data.name);
    }
    if (data.volume !== undefined) {
      await expect(this.volumeInput).toHaveValue(data.volume);
    }
    if (data.description !== undefined) {
      await expect(this.descriptionInput).toHaveValue(data.description);
    }
  }

  /**
   * Get validation error message for a specific field
   */
  async getFieldError(field: "name" | "type" | "volume" | "description"): Promise<string | null> {
    const fieldMap = {
      name: this.nameInput,
      type: this.typeSelect,
      volume: this.volumeInput,
      description: this.descriptionInput,
    };

    const fieldLocator = fieldMap[field];
    const errorLocator = fieldLocator
      .locator("xpath=following-sibling::p[contains(@class, 'text-destructive')]")
      .first();

    if (await errorLocator.isVisible()) {
      return await errorLocator.textContent();
    }

    return null;
  }
}
