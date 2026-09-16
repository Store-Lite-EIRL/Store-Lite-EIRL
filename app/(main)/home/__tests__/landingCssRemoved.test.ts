import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * T-039 — Legacy `landing.css` removal guard.
 *
 * The monolithic 5546-line global stylesheet must be fully gone:
 * - `app/page.tsx` must not import it
 * - the file itself must be deleted
 * - no other source file in `app/` may reference it
 *
 * Also asserts the page-level assembly of T-038 (new component imports,
 * legacy imports dropped) at the source level; the rendered-DOM checks
 * live in `landingPage.integration.test.tsx`.
 */

const moduleDir = dirname(fileURLToPath(import.meta.url));
// __tests__ -> app/(main)/home -> app/(main) -> app
const appDir = join(moduleDir, '../../..');
const pageSource = readFileSync(join(appDir, 'page.tsx'), 'utf-8');
const landingCssPath = join(moduleDir, '../landing.css');

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    // Skip test files — production sources are the ones that ship the import.
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      files.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx|css)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const appSourceFiles = collectSourceFiles(appDir);

describe('T-039 — legacy landing.css removal', () => {
  it('page.tsx no longer imports the legacy global stylesheet', () => {
    expect(pageSource).not.toContain('landing.css');
  });

  it('the legacy landing.css file has been deleted from the home directory', () => {
    expect(existsSync(landingCssPath)).toBe(false);
  });

  it('no source file under app/ references landing.css anymore', () => {
    const offenders = appSourceFiles.filter((file) => {
      const source = readFileSync(file, 'utf-8');
      return source.includes('landing.css');
    });
    expect(offenders).toEqual([]);
  });
});

describe('T-038 — page.tsx composes the new landing sections', () => {
  it('imports the new section components', () => {
    for (const name of [
      'FloatingNav',
      'HeroSection',
      'SolutionsSection',
      'CtaBanner',
      'StatsSection',
      'ProcessSection',
      'PricingSection',
      'TrustSection',
      'ContactSection',
      'FaqSection',
      'FooterSection',
      'LandingSessionRedirect',
    ]) {
      expect(pageSource).toContain(name);
    }
  });

  it('no longer imports the replaced legacy components', () => {
    expect(pageSource).not.toContain('HeroLanding');
    expect(pageSource).not.toContain('LandingNav');
  });

  it('renders ContactSection and FaqSection as sibling sections', () => {
    // ContactSection holds id="contacto"; FaqSection renders its own section after it.
    expect(pageSource).toContain('<ContactSection />');
    expect(pageSource).toContain('<FaqSection />');
  });
});
