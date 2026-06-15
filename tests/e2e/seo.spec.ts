import { expect, test } from '@playwright/test';

test('should return robots.txt', async ({ page }) => {
  const response = await page.goto('/robots.txt');
  expect(response?.ok()).toBeTruthy();
});

test('should return sitemap.xml', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');
  expect(response?.ok()).toBeTruthy();
});
