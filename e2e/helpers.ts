import { Page } from '@playwright/test';

/**
 * Test user fixtures for authentication tests
 */
export const testUsers = {
	validUser: {
		email: 'test@example.com',
		password: 'TestPassword123!',
	},
	invalidUser: {
		email: 'invalid@example.com',
		password: 'wrongpassword',
	},
};

/**
 * Helper function to login a user
 */
export async function loginUser(page: Page, email: string, password: string) {
	await page.goto('/login');
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
	await page.waitForURL('/login');
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
export async function createAquarium(page: Page, aquariumData: { name: string; type?: string }) {
	const addButton = page.locator('button:has-text("Add Aquarium")');
	await addButton.click();

	// Fill form
	await page.fill('input[name="name"]', aquariumData.name);
	if (aquariumData.type) {
		await page.selectOption('select[name="type"]', aquariumData.type);
	}

	// Submit form
	await page.click('button[type="submit"]:has-text("Create")');

	// Wait for success
	await page.locator(`text=${aquariumData.name}`).waitFor({ state: 'visible' });
}

/**
 * Helper to wait for API response
 */
export async function waitForApiResponse(page: Page, method: string, urlPattern: string | RegExp) {
	return page.waitForResponse((response) => {
		const matches = typeof urlPattern === 'string' ? response.url().includes(urlPattern) : response.url().match(urlPattern);
		return matches && response.request().method() === method;
	});
}

/**
 * Helper to take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
	const timestamp = new Date().toISOString().split('T')[0];
	return page.screenshot({ path: `./e2e/screenshots/${timestamp}-${name}.png` });
}

