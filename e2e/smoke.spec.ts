import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should load the login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/.*Login.*|.*ReefMetrics.*/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should load the register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveTitle(/.*Register.*|.*ReefMetrics.*/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should navigate to forgot password page", async ({ page }) => {
    await page.goto("/login");
    await page.click('a:has-text("Forgot password")');
    await expect(page).toHaveURL(/.*forgot-password/);
  });
});

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.*ReefMetrics.*/);
  });
});
