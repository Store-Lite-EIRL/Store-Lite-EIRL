// ── Types ─────────────────────────────────────────────────────────────────────

interface BusinessLike {
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  description: string | null;
  city: string | null;
}

interface ProductLike {
  title: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE_TITLE_MAX = 60;
const PRODUCT_TITLE_MAX = 60;
const DESC_MIN = 150;
const DESC_MAX = 160;

// ── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Truncates `text` to `maxLen` chars at a word boundary (last space before maxLen).
 * Falls back to hard-slice if no word boundary exists within maxLen.
 * Appends '…' when truncation occurs.
 */
export function truncateAtWordBoundary(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;

  const slice = text.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');

  // Hard-slice fallback when no word boundary (e.g. long slug or no spaces)
  if (lastSpace <= 0) {
    return text.slice(0, maxLen - 1) + '…';
  }

  return text.slice(0, lastSpace) + '…';
}

/**
 * Pads or trims `text` to fit within [DESC_MIN, DESC_MAX] chars.
 * If too short, appends spaces (trimmed) or a period + padding.
 * If too long, truncates at word boundary.
 */
function normalizeDescriptionLength(text: string): string {
  if (text.length > DESC_MAX) {
    return truncateAtWordBoundary(text, DESC_MAX);
  }

  if (text.length >= DESC_MIN) {
    return text;
  }

  // Pad short descriptions: add period if missing, then spaces
  const base = text.endsWith('.') ? text : text + '.';
  const padding = ' ';
  const padded = base + padding.repeat(Math.max(0, DESC_MIN - base.length));
  return padded.slice(0, DESC_MAX);
}

// ── Public Functions ──────────────────────────────────────────────────────────

/**
 * Build store home page title (≤60 chars).
 * Priority: seoTitle → generated default with city.
 */
export function buildStoreTitle(business: BusinessLike): string {
  if (business.seoTitle) {
    return truncateAtWordBoundary(business.seoTitle, STORE_TITLE_MAX);
  }

  const fallback = `${business.name} — Tienda en ${business.city || 'Perú'}`;
  return truncateAtWordBoundary(fallback, STORE_TITLE_MAX);
}

/**
 * Build store home page description (150-160 chars).
 * Priority: seoDescription → description → generated default.
 */
export function buildStoreDescription(business: BusinessLike): string {
  if (business.seoDescription) {
    return normalizeDescriptionLength(business.seoDescription);
  }

  if (business.description) {
    return normalizeDescriptionLength(business.description);
  }

  const fallback = `Bienvenido a ${business.name}, tu tienda de confianza en ${business.city || 'Perú'}.`;
  return normalizeDescriptionLength(fallback);
}

/**
 * Build product page title (≤60 chars).
 * Priority: seoTitle → `${product.title} - ${business.name}`.
 */
export function buildProductTitle(product: ProductLike, business: BusinessLike): string {
  if (product.seoTitle) {
    return truncateAtWordBoundary(product.seoTitle, PRODUCT_TITLE_MAX);
  }

  const fallback = `${product.title} - ${business.name}`;
  return truncateAtWordBoundary(fallback, PRODUCT_TITLE_MAX);
}

/**
 * Build product page description (≤160 chars).
 * Priority: seoDescription → description.slice(0,160) → fallback.
 */
export function buildProductDescription(product: ProductLike, business: BusinessLike): string {
  if (product.seoDescription) {
    return truncateAtWordBoundary(product.seoDescription, DESC_MAX);
  }

  if (product.description) {
    return truncateAtWordBoundary(product.description, DESC_MAX);
  }

  return `Compra ${product.title} en ${business.name}`;
}
