import type { PatternCraftPattern } from '@/data/patterncraft/types';

/**
 * Load geometric patterns asynchronously.
 *
 * On the client, fetches `/patterns/geometric.json` from the public directory.
 * On the server, reads the file directly via `fs`.
 *
 * This avoids bundling the geometric pattern data into the initial client JS chunk.
 */
export async function loadGeometricPatterns(): Promise<PatternCraftPattern[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch('/patterns/geometric.json');
    if (!res.ok) {
      throw new Error(`Failed to load geometric patterns: ${res.statusText}`);
    }
    return res.json();
  }

  // Server-side: read from filesystem
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const content = readFileSync(join(process.cwd(), 'public/patterns/geometric.json'), 'utf-8');
  return JSON.parse(content);
}
