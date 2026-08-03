import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  businessesFindFirst: vi.fn(),
  aliasesFindFirst: vi.fn(),
}));

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: { findFirst: mocks.businessesFindFirst },
      businessSlugAliases: { findFirst: mocks.aliasesFindFirst },
    },
  },
}));

import {
  generateAvailableBusinessSlug,
  isBusinessSlugTaken,
  isReservedBusinessSlug,
} from '../slug';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('isReservedBusinessSlug', () => {
  it('reserves the platform complaint-book path', () => {
    expect(isReservedBusinessSlug('libro-reclamaciones')).toBe(true);
  });

  it('reserves the platform business slug', () => {
    expect(isReservedBusinessSlug('devkittop')).toBe(true);
  });

  it('does not reserve ordinary seller slugs', () => {
    expect(isReservedBusinessSlug('mi-tienda')).toBe(false);
  });
});

describe('isBusinessSlugTaken (reserved slugs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true for "libro-reclamaciones" without hitting the DB', async () => {
    await expect(isBusinessSlugTaken('libro-reclamaciones')).resolves.toBe(true);
    expect(mocks.businessesFindFirst).not.toHaveBeenCalled();
    expect(mocks.aliasesFindFirst).not.toHaveBeenCalled();
  });

  it('returns true for "devkittop" without hitting the DB', async () => {
    await expect(isBusinessSlugTaken('devkittop')).resolves.toBe(true);
    expect(mocks.businessesFindFirst).not.toHaveBeenCalled();
    expect(mocks.aliasesFindFirst).not.toHaveBeenCalled();
  });

  it('still checks the DB for non-reserved slugs', async () => {
    mocks.businessesFindFirst.mockResolvedValue(undefined);
    mocks.aliasesFindFirst.mockResolvedValue(undefined);

    await expect(isBusinessSlugTaken('mi-tienda')).resolves.toBe(false);
    expect(mocks.businessesFindFirst).toHaveBeenCalledTimes(1);
  });
});

describe('generateAvailableBusinessSlug (reserved slugs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('never returns a reserved slug', async () => {
    await expect(generateAvailableBusinessSlug(() => 'libro-reclamaciones')).rejects.toThrow(
      'No se pudo generar un slug disponible.',
    );
    expect(mocks.businessesFindFirst).not.toHaveBeenCalled();
  });

  it('returns a free non-reserved slug', async () => {
    mocks.businessesFindFirst.mockResolvedValue(undefined);
    mocks.aliasesFindFirst.mockResolvedValue(undefined);

    await expect(generateAvailableBusinessSlug(() => 'mi-tienda')).resolves.toBe('mi-tienda');
    expect(mocks.businessesFindFirst).toHaveBeenCalled();
  });
});
