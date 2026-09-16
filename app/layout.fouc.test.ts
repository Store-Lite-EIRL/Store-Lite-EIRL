import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('app/layout.tsx - FOUC prevention inline script', () => {
  const layoutPath = join(__dirname, 'layout.tsx');
  let layoutContent: string;

  beforeAll(() => {
    layoutContent = readFileSync(layoutPath, 'utf-8');
  });

  it('should have an inline script in head for FOUC prevention', () => {
    const headMatch = layoutContent.match(/<head>([\s\S]*?)<\/head>/);
    expect(headMatch).toBeTruthy();
    if (headMatch) {
      expect(headMatch[1]).toMatch(/<script[^>]*>/);
    }
  });

  it('should read localStorage.getItem for app-theme', () => {
    const headMatch = layoutContent.match(/<head>([\s\S]*?)<\/head>/);
    expect(headMatch).toBeTruthy();
    if (headMatch) {
      expect(headMatch[1]).toMatch(/localStorage\.getItem\(['"]app-theme['"]\)/);
    }
  });

  it('should set document.documentElement.setAttribute for data-theme', () => {
    const headMatch = layoutContent.match(/<head>([\s\S]*?)<\/head>/);
    expect(headMatch).toBeTruthy();
    if (headMatch) {
      expect(headMatch[1]).toMatch(/document\.documentElement\.setAttribute\(['"]data-theme['"]/);
    }
  });

  it('should handle system theme with matchMedia', () => {
    const headMatch = layoutContent.match(/<head>([\s\S]*?)<\/head>/);
    expect(headMatch).toBeTruthy();
    if (headMatch) {
      expect(headMatch[1]).toMatch(/matchMedia\(['"]\(prefers-color-scheme: dark\)['"]\)/);
    }
  });

  it('should be placed before ThemeBoot and stylesheet links', () => {
    const headMatch = layoutContent.match(/<head>([\s\S]*?)<\/head>/);
    expect(headMatch).toBeTruthy();
    if (headMatch) {
      const headContent = headMatch[1];
      const scriptIndex = headContent.indexOf('<script');
      const themeBootIndex = headContent.indexOf('<ThemeBoot');
      const linkIndex = headContent.indexOf('<link');

      expect(scriptIndex).toBeGreaterThan(-1);
      // Script should come before ThemeBoot and stylesheet links
      if (themeBootIndex > -1) {
        expect(scriptIndex).toBeLessThan(themeBootIndex);
      }
      if (linkIndex > -1) {
        expect(scriptIndex).toBeLessThan(linkIndex);
      }
    }
  });
});
