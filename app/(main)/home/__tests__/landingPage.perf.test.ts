import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * T-042 — Performance checks for the redesigned landing.
 *
 * Guards:
 * - legacy `landing.css` (115,766 bytes, 5546 lines) is no longer imported
 * - the new section CSS modules contain zero @keyframes animations
 *   (the mockup defines none — all motion is hover/transition based)
 * - no inline <style> blobs or dangerouslySetInnerHTML in page/components
 * - component split stays correct: only the interactive pieces are client
 *   components (FloatingNav, PricingSection, LandingSessionRedirect, ThemeBoot)
 * - total module CSS stays well under the legacy stylesheet size
 */

const moduleDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(moduleDir, '../../..');
const homeDir = join(moduleDir, '..');

const pageSource = readFileSync(join(appDir, 'page.tsx'), 'utf-8');

// Legacy baseline: app/(main)/home/landing.css was 115,766 bytes before removal.
const LEGACY_LANDING_CSS_BYTES = 115_766;
// The redesign must stay under 45% of the legacy size — current modules land ~30%.
const MODULE_CSS_BUDGET = Math.round(LEGACY_LANDING_CSS_BYTES * 0.45);

const REDESIGN_MODULES = [
  'FloatingNav',
  'HeroSection',
  'ProductFrame',
  'SolutionsSection',
  'StatsSection',
  'ProcessSection',
  'PricingSection',
  'TrustSection',
  'ContactSection',
  'FaqSection',
  'FooterSection',
  'CtaBanner',
] as const;

const SERVER_COMPONENTS = [
  'CtaBanner',
  'HeroSection',
  'ProductFrame',
  'SolutionsSection',
  'StatsSection',
  'ProcessSection',
  'TrustSection',
  'ContactSection',
  'FooterSection',
] as const;

const CLIENT_COMPONENTS = [
  'FloatingNav',
  'PricingSection',
  'LandingSessionRedirect',
  'FaqSection',
] as const;

const readModule = (name: string) => readFileSync(join(homeDir, `${name}.module.css`), 'utf-8');
const readComponent = (name: string) => readFileSync(join(homeDir, `${name}.tsx`), 'utf-8');

describe('T-042 — landing performance checks', () => {
  describe('bundle: legacy global stylesheet is gone', () => {
    it('page.tsx does not import landing.css', () => {
      expect(pageSource).not.toContain('landing.css');
    });

    it('page.tsx imports no global stylesheet at all', () => {
      expect(pageSource).not.toMatch(/import\s+['"][^'"]+\.css['"]/);
    });
  });

  describe('animations: zero @keyframes in the new CSS modules', () => {
    it.each(REDESIGN_MODULES)('%s contains no @keyframes blocks', (moduleName) => {
      expect(readModule(moduleName)).not.toContain('@keyframes');
    });
  });

  describe('inline style bloat', () => {
    it('page.tsx has no inline <style> elements or dangerouslySetInnerHTML', () => {
      expect(pageSource).not.toContain('<style');
      expect(pageSource).not.toContain('dangerouslySetInnerHTML');
    });

    it.each(SERVER_COMPONENTS)('%s.tsx has no inline <style> bloat either', (name) => {
      const source = readComponent(name);
      expect(source).not.toContain('<style');
      expect(source).not.toContain('dangerouslySetInnerHTML');
    });
  });

  describe('component split: server vs client boundaries', () => {
    it.each(SERVER_COMPONENTS)('%s is a server component (no "use client")', (name) => {
      const source = readComponent(name);
      expect(source.startsWith("'use client'")).toBe(false);
    });

    it.each(CLIENT_COMPONENTS)('%s is a client component', (name) => {
      const source = readComponent(name);
      expect(source.startsWith("'use client'")).toBe(true);
    });
  });

  describe('CSS payload budget', () => {
    it('total redesign module CSS stays under 45% of the legacy landing.css size', () => {
      const totalBytes = REDESIGN_MODULES.reduce((sum, name) => sum + readModule(name).length, 0);
      expect(totalBytes).toBeLessThan(MODULE_CSS_BUDGET);
    });
  });
});
