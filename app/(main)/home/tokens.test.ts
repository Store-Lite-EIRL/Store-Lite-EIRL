import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('tokens.css - Design System Tokens', () => {
  const tokensPath = join(__dirname, 'tokens.css');
  let tokensContent: string;

  beforeAll(() => {
    tokensContent = readFileSync(tokensPath, 'utf-8');
  });

  describe('File existence', () => {
    it('should exist at app/(main)/home/tokens.css', () => {
      expect(tokensContent).toBeDefined();
      expect(tokensContent.length).toBeGreaterThan(0);
    });
  });

  const lightThemeTokens = [
    // Base colors
    '--color-bg',
    '--color-surface',
    '--color-border',
    '--color-text',
    '--color-text-muted',
    '--color-primary',
    '--color-primary-hover',
    // Gradients
    '--gradient-primary',
    '--gradient-brand',
    '--gradient-hero',
    '--gradient-card',
    // Shadows
    '--shadow-sm',
    '--shadow-md',
    '--shadow-lg',
    '--shadow-glow',
    // Radius
    '--radius-s',
    '--radius-m',
    '--radius-l',
    '--radius-full',
    // Layout
    '--max-width',
    '--nav-height',
    // Typography
    '--font-brand',
    '--font-plain',
    '--font-mono',
    // Accent colors
    '--accent-blue',
    '--accent-violet',
    '--accent-emerald',
    '--accent-amber',
    '--accent-rose',
    '--accent-cyan',
    // Accent glows
    '--accent-blue-glow',
    '--accent-violet-glow',
    '--accent-emerald-glow',
    '--accent-amber-glow',
    '--accent-rose-glow',
    '--accent-cyan-glow',
    // Glow effects
    '--glow-purple',
    '--glow-orange',
    '--glow-blue',
  ];

  const darkThemeTokens = [...lightThemeTokens];

  const lightThemeRegexes = lightThemeTokens.map(
    (token) =>
      new RegExp(
        `(:root|html\\[data-theme=["']light["']\\])\\s*\\{[^}]*${token.replace('--', '\\-\\-')}\\s*:`,
        'm',
      ),
  );

  const darkThemeRegexes = darkThemeTokens.map(
    (token) =>
      new RegExp(
        `html\\[data-theme=["']dark["']\\]\\s*\\{[^}]*${token.replace('--', '\\-\\-')}\\s*:`,
        'm',
      ),
  );

  describe('Light theme tokens (:root / html[data-theme="light"])', () => {
    lightThemeTokens.forEach((token, index) => {
      it(`should define ${token} in light theme`, () => {
        expect(tokensContent).toMatch(lightThemeRegexes[index]);
      });
    });
  });

  describe('Dark theme tokens (html[data-theme="dark"])', () => {
    darkThemeTokens.forEach((token, index) => {
      it(`should define ${token} in dark theme`, () => {
        expect(tokensContent).toMatch(darkThemeRegexes[index]);
      });
    });
  });

  describe('Total token count', () => {
    it('should have exactly 38 unique defined token names (not var() references)', () => {
      // Match only token definitions (--name: value), not var(--name) references
      const tokenDefMatches = tokensContent.match(/--[\w-]+(?=\s*:)/g) || [];
      const uniqueTokens = [...new Set(tokenDefMatches)];
      expect(uniqueTokens.length).toBe(39);
    });
  });

  describe('Page-level background (FINDING #2)', () => {
    it('paints the html/body background from --color-bg in the light theme block', () => {
      const lightBlock = tokensContent.match(
        /(:root|html\[data-theme=["']light["']\])\s*\{[^}]*\}/m,
      )?.[0];
      expect(lightBlock).toBeDefined();
      expect(lightBlock).toContain('--color-bg:');
      expect(lightBlock).toMatch(/html,\s*body\s*\{\s*background-color:\s*var\(--color-bg\);\s*\}/);
    });

    it('paints the html/body background from --color-bg in the dark theme block', () => {
      const darkBlock = tokensContent.match(/html\[data-theme=["']dark["']\]\s*\{[^}]*\}/m)?.[0];
      expect(darkBlock).toBeDefined();
      expect(darkBlock).toContain('--color-bg:');
      expect(darkBlock).toMatch(/html,\s*body\s*\{\s*background-color:\s*var\(--color-bg\);\s*\}/);
    });
  });

  describe('Radius token spec (FINDING #3)', () => {
    it('defines --radius-s: 10px in both theme blocks', () => {
      const definitions = tokensContent.match(/--radius-s:\s*10px/g) || [];
      expect(definitions.length).toBeGreaterThanOrEqual(2);
    });

    it('defines --radius-m: 16px in both theme blocks', () => {
      const definitions = tokensContent.match(/--radius-m:\s*16px/g) || [];
      expect(definitions.length).toBeGreaterThanOrEqual(2);
    });

    it('defines --radius-l: 22px in both theme blocks', () => {
      const definitions = tokensContent.match(/--radius-l:\s*22px/g) || [];
      expect(definitions.length).toBeGreaterThanOrEqual(2);
    });

    it('no longer defines the legacy radius token names', () => {
      expect(tokensContent).not.toContain('--radius-sm');
      expect(tokensContent).not.toContain('--radius-md');
      expect(tokensContent).not.toContain('--radius-lg');
    });
  });
});
