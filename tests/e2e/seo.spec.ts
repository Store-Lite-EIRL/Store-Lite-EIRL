import { expect, test } from '@playwright/test';

test('should return robots.txt', async ({ page }) => {
  const response = await page.goto('/robots.txt');
  expect(response?.status()).toBe(200);
  const text = await response?.text();
  expect(text).toContain('User-agent');
});

test('should return sitemap.xml', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');
  expect(response?.status()).toBe(200);
  const text = await response?.text();
  expect(text).toContain('xml');
});
