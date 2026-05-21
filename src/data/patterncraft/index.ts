export { decorativePatterns } from './decorative';
export { effectsPatterns } from './effects';
export { geometricPatterns } from './geometric';
export { gradientsPatterns } from './gradients';
export type { PatternCraftCategory, PatternCraftPattern, PatternCraftStyle } from './types';

import { decorativePatterns } from './decorative';
import { effectsPatterns } from './effects';
import { geometricPatterns } from './geometric';
import { gradientsPatterns } from './gradients';
import type { PatternCraftPattern } from './types';

/** All patterns from PatternCraft, organized by category. */
export const patternCraftByCategory: Record<string, PatternCraftPattern[]> = {
  gradients: gradientsPatterns,
  geometric: geometricPatterns,
  decorative: decorativePatterns,
  effects: effectsPatterns,
};

/** Flat list of all PatternCraft patterns. */
export const allPatternCraftPatterns: PatternCraftPattern[] = [
  ...gradientsPatterns,
  ...geometricPatterns,
  ...decorativePatterns,
  ...effectsPatterns,
];

/** Look up a PatternCraft pattern by its ID. */
export function getPatternCraftById(id: string): PatternCraftPattern | undefined {
  return allPatternCraftPatterns.find((p) => p.id === id);
}
