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
    '--gradient-hero',
    '--gradient-card',
    // Shadows
    '--shadow-sm',
    '--shadow-md',
    '--shadow-lg',
    '--shadow-glow',
    // Radius
    '--radius-sm',
    '--radius-md',
    '--radius-lg',
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
      expect(uniqueTokens.length).toBe(38);
    });
  });
});
