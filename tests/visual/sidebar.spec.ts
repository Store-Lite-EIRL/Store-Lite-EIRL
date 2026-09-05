import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Visual Regression Tests for Sidebar v2
 * Tests sidebar states across themes and breakpoints
 */

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}
interface ThemeConfig {
  name: string;
  className: string;
}
interface PageConfig {
  name: string;
  path: string;
}
interface SidebarStateConfig {
  name: string;
  state: string;
}

const VIEWPORTS: ViewportConfig[] = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 375, height: 667 },
];

const THEMES: ThemeConfig[] = [
  { name: 'light', className: '' },
  { name: 'dark', className: 'dark' },
];

const PAGES: PageConfig[] = [
  { name: 'home', path: '/company' },
  { name: 'chat', path: '/company/chat' },
];

const SIDEBAR_STATES: SidebarStateConfig[] = [
  { name: 'collapsed', state: 'collapsed' },
  { name: 'expanded', state: 'expanded' },
  { name: 'mobile-open', state: 'mobile-open' },
];

function isValidCombo(
  viewport: ViewportConfig,
  page: PageConfig,
  sidebarState: SidebarStateConfig,
): boolean {
  const isMobile = viewport.name === 'mobile';
  const isChat = page.name === 'chat';
  const isMobileOpen = sidebarState.state === 'mobile-open';

  if (isMobile && !isMobileOpen && sidebarState.state !== 'collapsed') return false;
  if (isChat && isMobile && isMobileOpen) return false;
  return true;
}

async function setupFeatureFlag(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__NEXT_PUBLIC_SIDEBAR_V2', {
      value: true,
      writable: false,
      configurable: false,
    });
  });
}

async function setupTheme(page: Page, themeClass: string): Promise<void> {
  if (themeClass) {
    await page.addInitScript((cls: string) => {
      document.body.classList.add(cls);
    }, themeClass);
  }
}

async function setupViewportAndNavigate(
  page: Page,
  viewport: ViewportConfig,
  pagePath: string,
): Promise<void> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(pagePath);
  await page.waitForSelector('[role="navigation"].sidebar', { timeout: 10000 });
}

async function setupSidebarState(page: Page, state: string): Promise<void> {
  await page.evaluate((s: string) => {
    localStorage.setItem('sidebar:v1:state', JSON.stringify({ state: s, timestamp: Date.now() }));
  }, state);
  await page.reload();
  await page.waitForSelector('[role="navigation"].sidebar', { timeout: 10000 });
}

interface VisualTestParams {
  page: Page;
  viewport: ViewportConfig;
  theme: ThemeConfig;
  pageConfig: PageConfig;
  sidebarState: SidebarStateConfig;
}

async function runVisualTest(params: VisualTestParams): Promise<void> {
  const { page, viewport, theme, pageConfig, sidebarState } = params;
  await setupTheme(page, theme.className);
  await setupViewportAndNavigate(page, viewport, pageConfig.path);
  await setupSidebarState(page, sidebarState.state);
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const overlay = document.querySelector('.loadingOverlay');
    if (overlay) (overlay as HTMLElement).style.display = 'none';
  });

  const sidebar = page.locator('[role="navigation"].sidebar');
  await expect(sidebar).toHaveScreenshot(
    `sidebar-${pageConfig.name}-${sidebarState.name}-${viewport.name}-${theme.name}.png`,
    { maxDiffPixels: 100, threshold: 0.2 },
  );
}

test.describe('Sidebar Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await setupFeatureFlag(page);
  });

  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      for (const pageConfig of PAGES) {
        for (const sidebarState of SIDEBAR_STATES) {
          if (!isValidCombo(viewport, pageConfig, sidebarState)) continue;

          test(`${pageConfig.name} - ${sidebarState.name} - ${viewport.name} - ${theme.name}`, async ({
            page,
          }) => {
            await runVisualTest({ page, viewport, theme, pageConfig, sidebarState });
          });
        }
      }
    }
  }
});

test.describe('Reduced Motion', () => {
  test('sidebar transitions disabled with prefers-reduced-motion', async ({ page }) => {
    await setupFeatureFlag(page);
    await page.addInitScript(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      Object.defineProperty(mediaQuery, 'matches', { value: true });
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/company');
    await page.waitForSelector('[role="navigation"].sidebar', { timeout: 10000 });

    await setupSidebarState(page, 'expanded');

    const sidebar = page.locator('[role="navigation"].sidebar');
    const style = await sidebar.evaluate(
      (el: HTMLElement) => getComputedStyle(el).transitionDuration,
    );
    expect(parseFloat(style)).toBeLessThanOrEqual(0.01);
  });
});

test.describe('Chat Page Layout', () => {
  test('chat page desktop shows rail', async ({ page }) => {
    await setupFeatureFlag(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/company/chat');
    await page.waitForSelector('[role="navigation"].sidebar', { timeout: 10000 });

    const sidebar = page.locator('[role="navigation"].sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/sidebar--collapsed/);
  });

  test('chat page mobile hides sidebar when open', async ({ page }) => {
    await setupFeatureFlag(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/company/chat');
    await page.waitForSelector('[role="navigation"].sidebar', { timeout: 10000 });

    await setupSidebarState(page, 'mobile-open');
    await page.waitForTimeout(500);

    const sidebar = page.locator('[role="navigation"].sidebar');
    await expect(sidebar).toHaveCount(0);
  });
});

test.describe('Sidebar Keyboard Navigation', () => {
  test('focus visible styles applied on tab navigation', async ({ page }) => {
    await setupFeatureFlag(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/company');
    await page.waitForSelector('[role="navigation"].sidebar', { timeout: 10000 });

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedItem = page.locator('.sidebar__item:focus-visible');
    await expect(focusedItem).toBeVisible();

    const outline = await focusedItem.evaluate(
      (el: HTMLElement) => getComputedStyle(el).outlineWidth,
    );
    expect(parseInt(outline, 10)).toBeGreaterThan(0);
  });
});
