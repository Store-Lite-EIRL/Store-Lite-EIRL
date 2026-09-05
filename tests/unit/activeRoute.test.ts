import {
  getActiveItemId,
  isActive,
  isSubmenuActive,
} from '@/shared/components/navigation/activeRoute';
import { describe, expect, it } from 'vitest';

const mockSlug = 'test-business';

describe('isActive', () => {
  it('returns true for exact root match', () => {
    const path = `/${mockSlug}`;
    const pathname = `/${mockSlug}`;
    expect(isActive(path, pathname, mockSlug)).toBe(true);
  });

  it('returns false for root path mismatch', () => {
    const path = `/${mockSlug}`;
    const pathname = `/${mockSlug}/dashboard`;
    expect(isActive(path, pathname, mockSlug)).toBe(false);
  });

  it('returns true for prefix match on nested routes', () => {
    const path = `/${mockSlug}/dashboard`;
    const pathname = `/${mockSlug}/dashboard/widgets`;
    expect(isActive(path, pathname, mockSlug)).toBe(true);
  });

  it('returns true for exact nested match', () => {
    const path = `/${mockSlug}/chat`;
    const pathname = `/${mockSlug}/chat`;
    expect(isActive(path, pathname, mockSlug)).toBe(true);
  });

  it('returns true for prefix match (chat matches chatroom)', () => {
    const path = `/${mockSlug}/chat`;
    const pathname = `/${mockSlug}/chatroom`;
    expect(isActive(path, pathname, mockSlug)).toBe(true);
  });

  it('returns true for storage matching product routes', () => {
    const path = `/${mockSlug}/storage`;
    const pathname = `/${mockSlug}/product/123`;
    expect(isActive(path, pathname, mockSlug)).toBe(true);
  });

  it('returns true for storage matching product edit routes', () => {
    const path = `/${mockSlug}/storage`;
    const pathname = `/${mockSlug}/product/123/edit`;
    expect(isActive(path, pathname, mockSlug)).toBe(true);
  });

  it('returns false for storage not matching unrelated routes', () => {
    const path = `/${mockSlug}/storage`;
    const pathname = `/${mockSlug}/chat`;
    expect(isActive(path, pathname, mockSlug)).toBe(false);
  });

  it('returns false for different slug', () => {
    const path = `/${mockSlug}/dashboard`;
    const pathname = `/other-business/dashboard`;
    expect(isActive(path, pathname, mockSlug)).toBe(false);
  });

  it('handles paths without leading slash in slug', () => {
    const path = `/${mockSlug}/settings`;
    const pathname = `/${mockSlug}/settings/profile`;
    expect(isActive(path, pathname, mockSlug)).toBe(true);
  });
});

describe('isSubmenuActive', () => {
  it('uses same logic as isActive', () => {
    const path = `/${mockSlug}/chat`;
    const pathname = `/${mockSlug}/chat/conversation/123`;
    expect(isSubmenuActive(path, pathname, mockSlug)).toBe(true);
  });
});

describe('getActiveItemId', () => {
  const mockItems: { id: string; path: string }[] = [
    { id: 'home', path: `/${mockSlug}` },
    { id: 'chat', path: `/${mockSlug}/chat` },
    { id: 'notifications', path: `/${mockSlug}/notifications` },
    { id: 'storage', path: `/${mockSlug}/storage` },
    { id: 'soporte', path: `/${mockSlug}/soporte` },
    { id: 'dashboard', path: `/${mockSlug}/dashboard` },
    { id: 'settings', path: `/${mockSlug}/settings` },
  ];

  it('returns correct active item for root', () => {
    expect(getActiveItemId(mockItems, `/${mockSlug}`, mockSlug)).toBe('home');
  });

  it('returns correct active item for nested route', () => {
    expect(getActiveItemId(mockItems, `/${mockSlug}/chat`, mockSlug)).toBe('chat');
  });

  it('returns correct active item for deep nested route', () => {
    expect(getActiveItemId(mockItems, `/${mockSlug}/dashboard/widgets`, mockSlug)).toBe(
      'dashboard',
    );
  });

  it('returns storage for product routes', () => {
    expect(getActiveItemId(mockItems, `/${mockSlug}/product/123`, mockSlug)).toBe('storage');
  });

  it('returns null for no match', () => {
    expect(getActiveItemId(mockItems, `/${mockSlug}/unknown`, mockSlug)).toBeNull();
  });

  it('returns first match in order', () => {
    // If multiple items could match, first one wins
    const itemsWithOverlap = [
      { id: 'parent', path: `/${mockSlug}/parent` },
      { id: 'child', path: `/${mockSlug}/parent/child` },
    ];
    expect(getActiveItemId(itemsWithOverlap, `/${mockSlug}/parent/child`, mockSlug)).toBe('parent');
  });
});
