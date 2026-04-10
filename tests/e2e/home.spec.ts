import { test, expect } from '@playwright/test';

test.describe('landing page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);
  });

  test('has a document title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });
});
