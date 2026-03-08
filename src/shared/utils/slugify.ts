/**
 * Generates a URL-safe slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w-]/g, '-') // Simplified alphanumeric replacement (ReDoS safe)
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+/g, '') // Remove leading hyphens
    .replace(/-{2,}/g, '-'); // Remove trailing hyphens
}

/**
 * Generates a unique business slug with a store type suffix and a random ID.
 */
export function generateBusinessSlug(name: string, storeType: string): string {
  const base = slugify(name);

  let suffix = '';
  switch (storeType) {
    case 'service':
      suffix = '-service';
      break;
    case 'consultancy':
      suffix = '-consultancy';
      break;
    case 'store':
      suffix = '-store';
      break;
  }

  let finalBase = `${base}${suffix}`;

  if (finalBase.length < 3) {
    finalBase = `biz-${finalBase}`;
  }

  // Use simple robust randomness
  // eslint-disable-next-line sonarjs/pseudo-random
  const randomPart = Math.random().toString(36).substring(2, 6);
  return `${finalBase}-${randomPart}`;
}
