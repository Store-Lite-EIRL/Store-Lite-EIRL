import { useSidebarState } from '@/hooks/useSidebarState';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock matchMedia for prefers-reduced-motion
const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  value: matchMediaMock,
  writable: true,
});

describe('useSidebarState', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('returns default state "collapsed" when no localStorage', () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.state).toBe('collapsed');
  });

  it('uses initialState when provided and no localStorage', () => {
    const { result } = renderHook(() => useSidebarState('expanded'));
    expect(result.current.state).toBe('expanded');
  });

  it('reads state from localStorage', () => {
    localStorageMock.setItem(
      'sidebar:v1:state',
      JSON.stringify({ state: 'expanded', timestamp: Date.now() }),
    );
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.state).toBe('expanded');
  });

  it('ignores invalid localStorage value', () => {
    localStorageMock.setItem('sidebar:v1:state', 'invalid');
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.state).toBe('collapsed');
  });

  it('toggle switches between expanded and collapsed', () => {
    const { result } = renderHook(() => useSidebarState('collapsed'));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.state).toBe('expanded');

    act(() => {
      result.current.toggle();
    });
    expect(result.current.state).toBe('collapsed');
  });

  it('setState updates state and localStorage', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.setState('mobile-open');
    });
    expect(result.current.state).toBe('mobile-open');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'sidebar:v1:state',
      expect.stringContaining('"state":"mobile-open"'),
    );
  });

  it('registerStorageListener returns cleanup function', () => {
    const { result } = renderHook(() => useSidebarState());
    const cleanup = result.current.registerStorageListener();
    expect(typeof cleanup).toBe('function');
    cleanup(); // Should not throw
  });

  it('cross-tab sync updates state from storage event', () => {
    const { result } = renderHook(() => useSidebarState('collapsed'));
    result.current.registerStorageListener();

    // Simulate storage event from another tab
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'sidebar:v1:state',
          newValue: JSON.stringify({ state: 'expanded', timestamp: Date.now() }),
          oldValue: JSON.stringify({ state: 'collapsed', timestamp: Date.now() - 1000 }),
        }),
      );
    });

    expect(result.current.state).toBe('expanded');
  });

  it('respects prefers-reduced-motion on first render', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useSidebarState());
    expect(result.current.state).toBe('collapsed');
  });

  it('persists state across re-renders', () => {
    const { result, rerender } = renderHook(() => useSidebarState('collapsed'));

    act(() => {
      result.current.setState('expanded');
    });
    expect(result.current.state).toBe('expanded');

    rerender();
    expect(result.current.state).toBe('expanded');
  });
});
