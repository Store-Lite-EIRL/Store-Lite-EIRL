import geometricData from '../../../public/patterns/geometric.json';
import type { PatternCraftPattern } from './types';

/**
 * Geometric patterns from PatternCraft — loaded from JSON instead of inline data.
 *
 * The full pattern data now lives in `public/patterns/geometric.json` to avoid
 * inflating the client JS bundle. This module re-exports the data synchronously
 * for backward compatibility with the barrel exports in `index.ts`.
 *
 * For new code that doesn't need synchronous access, prefer the async loader
 * in `@/lib/patterns/loadPatterns` to keep pattern data out of the initial chunk.
 */
export const geometricPatterns: PatternCraftPattern[] = geometricData as PatternCraftPattern[];
