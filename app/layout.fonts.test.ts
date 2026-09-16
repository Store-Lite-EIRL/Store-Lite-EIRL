import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('app/layout.tsx - Fonts via next/font', () => {
  const layoutPath = join(__dirname, 'layout.tsx');
  let layoutContent: string;

  beforeAll(() => {
    layoutContent = readFileSync(layoutPath, 'utf-8');
  });

  describe('Sora font (brand)', () => {
    it('should import Sora from next/font/google', () => {
      expect(layoutContent).toMatch(/import.*Sora.*from.*['"]next\/font\/google['"]/);
    });

    it('should define Sora with variable --font-sora', () => {
      expect(layoutContent).toMatch(/variable:\s*['"]--font-sora['"]/);
    });

    it('should apply Sora variable to html className', () => {
      expect(layoutContent).toMatch(/\$\{.*\.variable.*\}/);
    });
  });

  describe('Inter font (plain)', () => {
    it('should import Inter from next/font/google', () => {
      expect(layoutContent).toMatch(/import.*Inter.*from.*['"]next\/font\/google['"]/);
    });

    it('should define Inter with variable --font-inter', () => {
      expect(layoutContent).toMatch(/variable:\s*['"]--font-inter['"]/);
    });
  });

  describe('Roboto Mono font (mono)', () => {
    it('should import Roboto_Mono from next/font/google', () => {
      expect(layoutContent).toMatch(/import.*Roboto_Mono.*from.*['"]next\/font\/google['"]/);
    });

    it('should define Roboto_Mono with variable --font-roboto-mono', () => {
      expect(layoutContent).toMatch(/variable:\s*['"]--font-roboto-mono['"]/);
    });
  });

  describe('Font display and fallback', () => {
    it('should set display: swap for all fonts', () => {
      const swapMatches = layoutContent.match(/display:\s*['"]swap['"]/g);
      expect(swapMatches).toBeTruthy();
      expect((swapMatches || []).length).toBeGreaterThanOrEqual(3);
    });

    it('should define fallback fonts', () => {
      expect(layoutContent).toMatch(/fallback:.*system-ui/);
    });
  });
});
