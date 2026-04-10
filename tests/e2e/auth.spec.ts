import { test, expect } from '@playwright/test';

test.describe('auth flow', () => {
  test('dashboard redirects unauthenticated visitors', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/kinde|login|sign-in/i);
  });

  test('sign-in page renders', async ({ page }) => {
    const response = await page.goto('/sign-in');
    expect(response?.ok()).toBe(true);
  });
});
