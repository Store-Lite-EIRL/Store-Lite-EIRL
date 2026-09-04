import { describe, expect, it } from 'vitest';

import { buildSeoPreviewState, getCounterStatus } from '../seoPreview';

// ── getCounterStatus ─────────────────────────────────────────────────────────

describe('getCounterStatus', () => {
  describe('title (optimal 50–60)', () => {
    const titleRange = { min: 50, max: 60 };

    it('returns poor for 0', () => {
      expect(getCounterStatus(0, titleRange)).toBe('poor');
    });

    it('returns poor for 29', () => {
      expect(getCounterStatus(29, titleRange)).toBe('poor');
    });

    it('returns ok for 30', () => {
      expect(getCounterStatus(30, titleRange)).toBe('ok');
    });

    it('returns ok for 49', () => {
      expect(getCounterStatus(49, titleRange)).toBe('ok');
    });

    it('returns ideal for 50', () => {
      expect(getCounterStatus(50, titleRange)).toBe('ideal');
    });

    it('returns ideal for 55', () => {
      expect(getCounterStatus(55, titleRange)).toBe('ideal');
    });

    it('returns ideal for 60', () => {
      expect(getCounterStatus(60, titleRange)).toBe('ideal');
    });

    it('returns ok for 61', () => {
      expect(getCounterStatus(61, titleRange)).toBe('ok');
    });

    it('returns ok for 70', () => {
      expect(getCounterStatus(70, titleRange)).toBe('ok');
    });

    it('returns poor for 71', () => {
      expect(getCounterStatus(71, titleRange)).toBe('poor');
    });

    it('returns poor for 100', () => {
      expect(getCounterStatus(100, titleRange)).toBe('poor');
    });
  });

  describe('description (optimal 150–160)', () => {
    const descRange = { min: 150, max: 160, lowerOffset: 30 };

    it('returns poor for 0', () => {
      expect(getCounterStatus(0, descRange)).toBe('poor');
    });

    it('returns poor for 119', () => {
      expect(getCounterStatus(119, descRange)).toBe('poor');
    });

    it('returns ok for 120', () => {
      expect(getCounterStatus(120, descRange)).toBe('ok');
    });

    it('returns ok for 149', () => {
      expect(getCounterStatus(149, descRange)).toBe('ok');
    });

    it('returns ideal for 150', () => {
      expect(getCounterStatus(150, descRange)).toBe('ideal');
    });

    it('returns ideal for 155', () => {
      expect(getCounterStatus(155, descRange)).toBe('ideal');
    });

    it('returns ideal for 160', () => {
      expect(getCounterStatus(160, descRange)).toBe('ideal');
    });

    it('returns ok for 161', () => {
      expect(getCounterStatus(161, descRange)).toBe('ok');
    });

    it('returns ok for 170', () => {
      expect(getCounterStatus(170, descRange)).toBe('ok');
    });

    it('returns poor for 171', () => {
      expect(getCounterStatus(171, descRange)).toBe('poor');
    });

    it('returns poor for 200', () => {
      expect(getCounterStatus(200, descRange)).toBe('poor');
    });

    it('returns ok at the lower boundary of the description warning zone', () => {
      expect(getCounterStatus(120, descRange)).toBe('ok');
      expect(getCounterStatus(119, descRange)).toBe('poor');
    });
  });
});

// ── buildSeoPreviewState ─────────────────────────────────────────────────────

describe('buildSeoPreviewState', () => {
  const baseParams = {
    title: '',
    description: '',
    businessName: 'Mi Tienda',
    slug: 'mi-tienda',
  };

  it('returns fallback title when title is empty', () => {
    const state = buildSeoPreviewState(baseParams);
    expect(state.previewTitle).toBe('Mi Tienda | Store Lite');
  });

  it('returns fallback description when description is empty', () => {
    const state = buildSeoPreviewState(baseParams);
    expect(state.previewDescription).toBe('Configurá la descripción SEO...');
  });

  it('returns the title as-is when non-empty', () => {
    const state = buildSeoPreviewState({
      ...baseParams,
      title: 'Mi Tienda Online | Envíos a Todo Perú',
    });
    expect(state.previewTitle).toBe('Mi Tienda Online | Envíos a Todo Perú');
  });

  it('returns the description as-is when non-empty', () => {
    const desc = 'Comprá productos únicos en Mi Tienda — envíos a todo el país.';
    const state = buildSeoPreviewState({ ...baseParams, description: desc });
    expect(state.previewDescription).toBe(desc);
  });

  it('computes titleLength correctly', () => {
    const state = buildSeoPreviewState({ ...baseParams, title: 'Hola' });
    expect(state.titleLength).toBe(4);
  });

  it('computes descLength correctly', () => {
    const desc = 'Una descripción con quince caracteres';
    const state = buildSeoPreviewState({ ...baseParams, description: desc });
    expect(state.descLength).toBe(desc.length);
  });

  it('computes titleStatus based on length', () => {
    const short = buildSeoPreviewState({ ...baseParams, title: 'Hi' });
    expect(short.titleStatus).toBe('poor');

    const ideal = buildSeoPreviewState({
      ...baseParams,
      title: 'Mi Tienda Online — Envíos a Todo Perú, Comprá Fácil',
    });
    expect(ideal.titleStatus).toBe('ideal');

    const long = buildSeoPreviewState({
      ...baseParams,
      title: 'Una Tienda Increíblemente Larga Con Un Nombre Muy Largo Para Pruebas De Truncado',
    });
    expect(long.titleStatus).toBe('poor');
  });

  it('computes descStatus based on length', () => {
    const short = buildSeoPreviewState({ ...baseParams, description: 'Corto' });
    expect(short.descStatus).toBe('poor');

    const longText = 'A'.repeat(155);
    const ideal = buildSeoPreviewState({ ...baseParams, description: longText });
    expect(ideal.descStatus).toBe('ideal');

    const veryLong = 'A'.repeat(200);
    const over = buildSeoPreviewState({ ...baseParams, description: veryLong });
    expect(over.descStatus).toBe('poor');
  });

  it('builds previewUrl from slug', () => {
    const state = buildSeoPreviewState(baseParams);
    expect(state.previewUrl).toContain('mi-tienda');
  });

  it('handles unicode characters in title and description', () => {
    const state = buildSeoPreviewState({
      ...baseParams,
      title: 'Tienda Ñ — Acentos y eñes',
      description: 'Descripción con caracteres especiales: ñ, á, é, í, ó, ú.',
    });
    expect(state.previewTitle).toBe('Tienda Ñ — Acentos y eñes');
    expect(state.titleLength).toBe('Tienda Ñ — Acentos y eñes'.length);
  });

  it('handles very long title (truncation in preview)', () => {
    const longTitle = 'A'.repeat(100);
    const state = buildSeoPreviewState({ ...baseParams, title: longTitle });
    expect(state.titleLength).toBe(100);
    expect(state.titleStatus).toBe('poor');
  });

  it('handles very long description', () => {
    const longDesc = 'A'.repeat(200);
    const state = buildSeoPreviewState({ ...baseParams, description: longDesc });
    expect(state.descLength).toBe(200);
    expect(state.descStatus).toBe('poor');
  });
});
