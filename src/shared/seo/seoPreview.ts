// ── Types ─────────────────────────────────────────────────────────────────────

export type CounterStatus = 'ok' | 'ideal' | 'poor';

/** Optimal range plus the width of the "ok" warning zone below the minimum.
 * The lower warning zone is not symmetric between fields: a title is "ok" from
 * min-20 chars (50→30), a description from min-30 chars (150→120). Passing the
 * offset explicitly keeps getCounterStatus pure while honoring the design's
 * per-field ranges. */
export interface OptimalRange {
  min: number;
  max: number;
  /** Width of the lower "ok" warning zone. Defaults to 20. */
  lowerOffset?: number;
}

export interface SeoPreviewState {
  titleLength: number;
  descLength: number;
  titleStatus: CounterStatus;
  descStatus: CounterStatus;
  previewTitle: string;
  previewUrl: string;
  previewDescription: string;
}

// ── Pure Functions ────────────────────────────────────────────────────────────

/**
 * Compute status for a character count given optimal range.
 *
 * Title:  ideal 50–60, ok 30–49 or 61–70, poor <30 or >70
 * Desc:   ideal 150–160, ok 120–149 or 161–170, poor <120 or >170
 */
export function getCounterStatus(count: number, optimal: OptimalRange): CounterStatus {
  if (count >= optimal.min && count <= optimal.max) {
    return 'ideal';
  }

  // Warning zones: up to 10 chars above the max, or `lowerOffset` chars below
  // the min. Title ok = [min-20, min-1], description ok = [min-30, min-1].
  const warningAbove = count > optimal.max && count <= optimal.max + 10;
  const lowerThreshold = optimal.min - (optimal.lowerOffset ?? 20);
  const warningBelow = count >= lowerThreshold && count < optimal.min;

  if (warningAbove || warningBelow) {
    return 'ok';
  }

  return 'poor';
}

/**
 * Compute the full preview state for the SEO form.
 * Used by SettingsClient to derive display values.
 */
export function buildSeoPreviewState(params: {
  title: string;
  description: string;
  businessName: string;
  slug: string;
}): SeoPreviewState {
  const { title, description, businessName, slug } = params;

  const titleLength = title.length;
  const descLength = description.length;

  const titleStatus = getCounterStatus(titleLength, { min: 50, max: 60 });
  const descStatus = getCounterStatus(descLength, { min: 150, max: 160, lowerOffset: 30 });

  const previewTitle = title || `${businessName} | Store Lite`;
  const previewDescription = description || 'Configurá la descripción SEO...';
  const previewUrl = `storelite.app/${slug}`;

  return {
    titleLength,
    descLength,
    titleStatus,
    descStatus,
    previewTitle,
    previewUrl,
    previewDescription,
  };
}
