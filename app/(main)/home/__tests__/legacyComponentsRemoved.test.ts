import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * T-043 — Legacy landing component removal guard.
 *
 * `LandingNav.tsx` (global `landing-nav` classes) and `HeroLanding.tsx`
 * (global `hero-landing` / `glow-*` / `hero-proof` classes) were replaced by
 * `FloatingNav.tsx` and `HeroSection.tsx`. Their global stylesheet
 * (`landing.css`) is long gone, so the components were dead code:
 * - both files must be deleted from the home directory
 * - no production source under `app/` may reference them anymore
 */

const moduleDir = dirname(fileURLToPath(import.meta.url));
// __tests__ -> app/(main)/home
const homeDir = join(moduleDir, '..');

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

const homeSourceFiles = collectSourceFiles(homeDir);

describe('T-043 — legacy landing components removed', () => {
  const legacyComponents = ['LandingNav.tsx', 'HeroLanding.tsx'] as const;

  // The replaced components were deleted. Their module files
  // (LandingNav.module.css / HeroLanding.module.css) never existed.
  it.each(legacyComponents)('%s has been deleted from the home directory', (fileName) => {
    expect(existsSync(join(homeDir, fileName))).toBe(false);
  });

  it('no source file under app/(main)/home references the legacy components anymore', () => {
    // While the legacy files existed, they self-referenced and made this list non-empty.
    const offenders = homeSourceFiles.filter((file) => {
      const source = readFileSync(file, 'utf-8');
      return source.includes('LandingNav') || source.includes('HeroLanding');
    });
    expect(offenders).toEqual([]);
  });
});
