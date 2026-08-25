import { buildNavItems, getAllNavItems } from '@/shared/components/navigation/navData';
import type { Permission } from '@/shared/components/navigation/types';
import { describe, expect, it } from 'vitest';

const mockSlug = 'test-business';

// Full permissions for non-owner user (all items visible except plan-filtered)
const fullPermissions: Permission[] = [
  'chat.view',
  'notifications.view',
  'products.view',
  'categories.view',
  'dashboard.view',
];

describe('buildNavItems', () => {
  it('returns all items for owner', () => {
    const permissions: Permission[] = [];
    const items = buildNavItems({ slug: mockSlug, planName: 'pro', permissions, isOwner: true });

    expect(items).toHaveLength(7);
    expect(items.map((i) => i.id)).toEqual([
      'home',
      'chat',
      'notifications',
      'storage',
      'soporte',
      'dashboard',
      'settings',
    ]);
  });

  it('hides dashboard for basico plan', () => {
    const items = buildNavItems({
      slug: mockSlug,
      planName: 'basico',
      permissions: fullPermissions,
      isOwner: false,
    });

    expect(items.find((i) => i.id === 'dashboard')).toBeUndefined();
    expect(items).toHaveLength(6);
  });

  it('shows dashboard for non-basico plans', () => {
    const items = buildNavItems({
      slug: mockSlug,
      planName: 'pro',
      permissions: fullPermissions,
      isOwner: false,
    });

    expect(items.find((i) => i.id === 'dashboard')).toBeDefined();
    expect(items).toHaveLength(7);
  });

  it('hides chat when permission missing', () => {
    const permissions: Permission[] = [
      'notifications.view',
      'products.view',
      'categories.view',
      'dashboard.view',
    ];
    const items = buildNavItems({ slug: mockSlug, planName: 'pro', permissions, isOwner: false });

    expect(items.find((i) => i.id === 'chat')).toBeUndefined();
    expect(items.find((i) => i.id === 'notifications')).toBeDefined();
  });

  it('hides notifications when permission missing', () => {
    const permissions: Permission[] = [
      'chat.view',
      'products.view',
      'categories.view',
      'dashboard.view',
    ];
    const items = buildNavItems({ slug: mockSlug, planName: 'pro', permissions, isOwner: false });

    expect(items.find((i) => i.id === 'notifications')).toBeUndefined();
    expect(items.find((i) => i.id === 'chat')).toBeDefined();
  });

  it('shows storage with products.view permission', () => {
    const permissions: Permission[] = ['products.view'];
    const items = buildNavItems({ slug: mockSlug, planName: 'pro', permissions, isOwner: false });

    expect(items.find((i) => i.id === 'storage')).toBeDefined();
  });

  it('shows storage with categories.view permission', () => {
    const permissions: Permission[] = ['categories.view'];
    const items = buildNavItems({ slug: mockSlug, planName: 'pro', permissions, isOwner: false });

    expect(items.find((i) => i.id === 'storage')).toBeDefined();
  });

  it('hides storage when both permissions missing', () => {
    const permissions: Permission[] = ['chat.view', 'notifications.view'];
    const items = buildNavItems({ slug: mockSlug, planName: 'pro', permissions, isOwner: false });

    expect(items.find((i) => i.id === 'storage')).toBeUndefined();
  });

  it('hides dashboard when permission missing', () => {
    const permissions: Permission[] = [
      'chat.view',
      'notifications.view',
      'products.view',
      'categories.view',
    ];
    const items = buildNavItems({ slug: mockSlug, planName: 'pro', permissions, isOwner: false });

    expect(items.find((i) => i.id === 'dashboard')).toBeUndefined();
  });

  it('always shows home, soporte, settings', () => {
    const permissions: Permission[] = [];
    const items = buildNavItems({ slug: mockSlug, planName: 'pro', permissions, isOwner: false });

    expect(items.find((i) => i.id === 'home')).toBeDefined();
    expect(items.find((i) => i.id === 'soporte')).toBeDefined();
    expect(items.find((i) => i.id === 'settings')).toBeDefined();
  });

  it('uses correct paths with slug', () => {
    const items = buildNavItems({
      slug: mockSlug,
      planName: 'pro',
      permissions: [],
      isOwner: true,
    });

    expect(items.find((i) => i.id === 'home')?.path).toBe('/test-business');
    expect(items.find((i) => i.id === 'chat')?.path).toBe('/test-business/chat');
    expect(items.find((i) => i.id === 'storage')?.path).toBe('/test-business/storage');
    expect(items.find((i) => i.id === 'dashboard')?.path).toBe('/test-business/dashboard');
  });

  it('includes badge property in nav items', () => {
    const items = buildNavItems({
      slug: mockSlug,
      planName: 'pro',
      permissions: fullPermissions,
      isOwner: false,
    });

    // Notifications item should have badge property (for Supabase badge)
    const notificationsItem = items.find((i) => i.id === 'notifications');
    expect(notificationsItem).toBeDefined();
    expect('badge' in notificationsItem!).toBe(true);
    expect(notificationsItem!.badge).toBe('0');
  });

  it('case-insensitive plan matching', () => {
    const items = buildNavItems({
      slug: mockSlug,
      planName: 'BASICO',
      permissions: fullPermissions,
      isOwner: false,
    });

    expect(items.find((i) => i.id === 'dashboard')).toBeUndefined();
  });

  it('owner bypasses plan filter', () => {
    const permissions: Permission[] = [];
    const items = buildNavItems({ slug: mockSlug, planName: 'basico', permissions, isOwner: true });

    // Owner should see dashboard even on basico plan
    expect(items.find((i) => i.id === 'dashboard')).toBeDefined();
  });

  it('items have correct structure', () => {
    const items = buildNavItems({
      slug: mockSlug,
      planName: 'pro',
      permissions: [],
      isOwner: true,
    });

    items.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('path');
      expect(typeof item.id).toBe('string');
      expect(typeof item.icon).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(typeof item.path).toBe('string');
    });
  });
});

describe('getAllNavItems', () => {
  it('returns all 7 items without filtering', () => {
    const items = getAllNavItems(mockSlug);
    expect(items).toHaveLength(7);
  });

  it('includes all expected items', () => {
    const items = getAllNavItems(mockSlug);
    const ids = items.map((i) => i.id);
    expect(ids).toEqual([
      'home',
      'chat',
      'notifications',
      'storage',
      'soporte',
      'dashboard',
      'settings',
    ]);
  });

  it('includes permission and plan properties', () => {
    const items = getAllNavItems(mockSlug);
    const chatItem = items.find((i) => i.id === 'chat');
    const dashboardItem = items.find((i) => i.id === 'dashboard');

    expect(chatItem?.permission).toBe('chat.view');
    expect(dashboardItem?.plan).toBe('basico');
  });

  it('includes badge property for notifications', () => {
    const items = getAllNavItems(mockSlug);
    const notificationsItem = items.find((i) => i.id === 'notifications');
    expect(notificationsItem?.badge).toBe('0');
  });
});
