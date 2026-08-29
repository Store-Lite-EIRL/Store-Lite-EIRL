import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import type { NavItemData } from '@/shared/components/navigation/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockItems: NavItemData[] = [
  { id: 'home', icon: 'home', label: 'Inicio', path: '/test/home' },
  { id: 'chat', icon: 'chat', label: 'Mensajes', path: '/test/chat' },
  {
    id: 'notifications',
    icon: 'notifications',
    label: 'Notificaciones',
    path: '/test/notifications',
  },
];

describe('useKeyboardNavigation', () => {
  let container: HTMLDivElement;
  let onActivate: ReturnType<typeof vi.fn>;
  let onEscape: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    container.setAttribute('data-nav-container', 'true');
    // Pre-populate container with nav items
    container.innerHTML = mockItems
      .map(
        (item) => `
      <button
        data-nav-item
        data-nav-id="${item.id}"
        tabindex="-1"
        type="button"
      >
        ${item.label}
      </button>
    `,
      )
      .join('');
    document.body.appendChild(container);

    onActivate = vi.fn();
    onEscape = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  const createHook = () => {
    return renderHook(() => useKeyboardNavigation(mockItems, onActivate, onEscape));
  };

  const focusContainer = (
    result: ReturnType<typeof renderHook<{ containerRef: React.RefObject<HTMLDivElement | null> }>>,
  ) => {
    act(() => {
      result.current.containerRef.current = container;
      // Manually trigger focusin since jsdom doesn't auto-focus
      container.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
  };

  it('returns containerRef', () => {
    const { result } = createHook();
    expect(result.current.containerRef).toBeDefined();
    expect(typeof result.current.containerRef.current).toBe('object');
  });

  it('initializes roving tabindex on focus', () => {
    const { result } = createHook();

    focusContainer(result);

    const buttons = container.querySelectorAll('[data-nav-item]');
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');
    expect(buttons[2].getAttribute('tabindex')).toBe('-1');
  });

  it('ArrowDown moves focus to next item', () => {
    const { result } = createHook();

    focusContainer(result);

    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;
    expect(document.activeElement).toBe(buttons[0]);

    // Press ArrowDown
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ArrowUp moves focus to previous item', () => {
    const { result } = createHook();

    focusContainer(result);

    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;

    // Move to second item first
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[1]);

    // Press ArrowUp
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ArrowDown wraps to first item at end', () => {
    const { result } = createHook();

    focusContainer(result);

    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;

    // Move to last item
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[2]);

    // Press ArrowDown again - should wrap to first
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ArrowUp wraps to last item at beginning', () => {
    const { result } = createHook();

    focusContainer(result);

    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;
    expect(document.activeElement).toBe(buttons[0]);

    // Press ArrowUp - should wrap to last
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[2]);
  });

  it('Home moves focus to first item', () => {
    const { result } = createHook();

    focusContainer(result);

    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;

    // Move to last item
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[2]);

    // Press Home
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('End moves focus to last item', () => {
    const { result } = createHook();

    focusContainer(result);

    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;
    expect(document.activeElement).toBe(buttons[0]);

    // Press End
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[2]);
  });

  it('Enter activates focused item', () => {
    const { result } = createHook();

    focusContainer(result);

    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;
    expect(document.activeElement).toBe(buttons[0]);

    // Press Enter
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(onActivate).toHaveBeenCalledWith(mockItems[0]);
  });

  it('Space activates focused item', () => {
    const { result } = createHook();

    focusContainer(result);

    // Move to second item
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;
    expect(document.activeElement).toBe(buttons[1]);

    // Press Space
    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });

    expect(onActivate).toHaveBeenCalledWith(mockItems[1]);
  });

  it('Escape calls onEscape', () => {
    const { result } = createHook();

    focusContainer(result);

    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('only responds to keyboard when container is focused', () => {
    const { result } = createHook();

    act(() => {
      result.current.containerRef.current = container;
      // Don't focus container
    });

    act(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    // Should not have moved focus (no active element in container)
    const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;
    expect(document.activeElement).not.toBe(buttons[0]);
  });
});
