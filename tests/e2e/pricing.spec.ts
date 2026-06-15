import { expect, test } from '@playwright/test';

test('should load pricing page with plans', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page).toHaveTitle(/Store Lite/i);

  // Core plan titles should be visible
  await expect(page.getByText('Plan Emprendedor')).toBeVisible();
  await expect(page.getByText('Plan Business Pro')).toBeVisible();
  await expect(page.getByText('Plan Enterprise AI')).toBeVisible();
});
