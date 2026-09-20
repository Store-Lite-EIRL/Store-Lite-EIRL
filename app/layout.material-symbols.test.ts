import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('app/layout.tsx - Material Symbols link', () => {
  const layoutPath = join(__dirname, 'layout.tsx');
  let layoutContent: string;

  beforeAll(() => {
    layoutContent = readFileSync(layoutPath, 'utf-8');
  });

  it('should have Material Symbols Rounded Google Fonts link in head', () => {
    expect(layoutContent).toMatch(
      /<link[^>]*rel="stylesheet"[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols\+Rounded/,
    );
  });

  it('should have the correct opsz,wght,FILL,GRAD parameters', () => {
    expect(layoutContent).toMatch(/opsz,wght,FILL,GRAD@20\.\.48,300\.\.600,0\.\.1,-25\.\.0/);
  });

  it('should be placed in the head section', () => {
    const headMatch = layoutContent.match(/<head>([\s\S]*?)<\/head>/);
    expect(headMatch).toBeTruthy();
    if (headMatch) {
      expect(headMatch[1]).toMatch(/Material\+Symbols\+Rounded/);
    }
  });
});
