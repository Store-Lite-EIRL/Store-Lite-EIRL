import { slugify } from './slugify';

export function getUniqueProductSlug(title: string, usedSlugs: Set<string>): string {
  const base = slugify(title) || 'producto';
  let candidate = base;
  let index = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
}
