import { useMobileDrawer } from '@/hooks/useMobileDrawer';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useMobileDrawer', () => {
  let onClose: ReturnType<typeof vi.fn>;
  let drawerContainer: HTMLDivElement;
  let backdropContainer: HTMLDivElement;
  let focusTrapContainer: HTMLDivElement;

  beforeEach(() => {
    onClose = vi.fn();

    // jsdom schedules requestAnimationFrame on a real timer that sync act()
    // never flushes, so focus-trap timing tests would be flaky. Invoke the
    // callback synchronously instead, which act() covers deterministically.
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });

    // jsdom performs no layout, so offset sizes and client rects are always
    // zero/empty and the hook's visibility filter would exclude every element.
    // Simulate rendered geometry so the focus trap sees the buttons.
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(10);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(10);

    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Create drawer structure
    drawerContainer = document.createElement('div');
    backdropContainer = document.createElement('div');
    focusTrapContainer = document.createElement('div');

    // Add focusable elements to focus trap (only buttons for predictable order)
    focusTrapContainer.innerHTML = `
      <button type="button" data-testid="item-1">Item 1</button>
      <button type="button" data-testid="item-2">Item 2</button>
      <button type="button" data-testid="item-3">Item 3</button>
    `;

    drawerContainer.appendChild(backdropContainer);
    drawerContainer.appendChild(focusTrapContainer);
    document.body.appendChild(drawerContainer);
  });

  afterEach(() => {
    document.body.removeChild(drawerContainer);
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('returns refs for drawer, backdrop, and focusTrap', () => {
    const { result } = renderHook(() => useMobileDrawer(false, onClose));
    expect(result.current.drawerRef).toBeDefined();
    expect(result.current.backdropRef).toBeDefined();
    expect(result.current.focusTrapRef).toBeDefined();
  });

  it('prevents body scroll when open', () => {
    const { rerender } = renderHook(({ isOpen }) => useMobileDrawer(isOpen, onClose), {
      initialProps: { isOpen: false },
    });

    expect(document.body.style.overflow).toBe('');

    rerender({ isOpen: true });
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.paddingRight).toBeDefined();

    rerender({ isOpen: false });
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
  });

  it('calls onClose on Escape key when open', () => {
    const { result, rerender } = renderHook(({ isOpen }) => useMobileDrawer(isOpen, onClose), {
      initialProps: { isOpen: false },
    });

    result.current.drawerRef.current = drawerContainer;
    result.current.backdropRef.current = backdropContainer;
    result.current.focusTrapRef.current = focusTrapContainer;

    rerender({ isOpen: true });

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape key when closed', () => {
    const { result } = renderHook(() => useMobileDrawer(false, onClose));

    result.current.drawerRef.current = drawerContainer;
    result.current.backdropRef.current = backdropContainer;
    result.current.focusTrapRef.current = focusTrapContainer;

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on backdrop click', () => {
    const { result, rerender } = renderHook(({ isOpen }) => useMobileDrawer(isOpen, onClose), {
      initialProps: { isOpen: false },
    });

    result.current.drawerRef.current = drawerContainer;
    result.current.backdropRef.current = backdropContainer;
    result.current.focusTrapRef.current = focusTrapContainer;

    rerender({ isOpen: true });

    act(() => {
      // Click directly on backdrop
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: backdropContainer });
      backdropContainer.dispatchEvent(clickEvent);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside drawer', () => {
    const { result, rerender } = renderHook(({ isOpen }) => useMobileDrawer(isOpen, onClose), {
      initialProps: { isOpen: false },
    });

    result.current.drawerRef.current = drawerContainer;
    result.current.backdropRef.current = backdropContainer;
    result.current.focusTrapRef.current = focusTrapContainer;

    rerender({ isOpen: true });

    act(() => {
      // Click on focus trap container (inside drawer)
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'target', { value: focusTrapContainer });
      focusTrapContainer.dispatchEvent(clickEvent);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps focus with Tab key', () => {
    const { result, rerender } = renderHook(({ isOpen }) => useMobileDrawer(isOpen, onClose), {
      initialProps: { isOpen: false },
    });

    result.current.drawerRef.current = drawerContainer;
    result.current.backdropRef.current = backdropContainer;
    result.current.focusTrapRef.current = focusTrapContainer;

    rerender({ isOpen: true });

    // Wait for requestAnimationFrame to complete (hook focuses first element)
    const buttons = focusTrapContainer.querySelectorAll('button') as NodeListOf<HTMLElement>;

    // The hook focuses the first element in requestAnimationFrame
    // In jsdom, we need to wait for the microtask queue
    act(() => {
      // Flush microtasks
    });

    // First focusable should be focused (by hook)
    expect(document.activeElement).toBe(buttons[0]);

    // Tab forward from last should wrap to first
    act(() => {
      buttons[2].focus();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[0]);

    // Shift+Tab from first should wrap to last
    act(() => {
      buttons[0].focus();
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
      );
    });

    expect(document.activeElement).toBe(buttons[2]);
  });

  it('restores focus to trigger on close', () => {
    const { result, rerender } = renderHook(({ isOpen }) => useMobileDrawer(isOpen, onClose), {
      initialProps: { isOpen: false },
    });

    result.current.drawerRef.current = drawerContainer;
    result.current.backdropRef.current = backdropContainer;
    result.current.focusTrapRef.current = focusTrapContainer;

    const triggerButton = document.createElement('button');
    triggerButton.id = 'trigger';
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    rerender({ isOpen: true });

    // Wait for hook to focus first element
    act(() => {});

    const buttons = focusTrapContainer.querySelectorAll('button') as NodeListOf<HTMLElement>;
    expect(document.activeElement).toBe(buttons[0]);

    rerender({ isOpen: false });

    // Wait for hook to restore focus
    act(() => {});

    // Focus should be restored to trigger
    expect(document.activeElement).toBe(triggerButton);
  });

  it('cleans up event listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useMobileDrawer(true, onClose));

    result.current.drawerRef.current = drawerContainer;
    result.current.backdropRef.current = backdropContainer;
    result.current.focusTrapRef.current = focusTrapContainer;

    unmount();

    // After unmount, body scroll should be restored
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');

    // Escape should not call onClose after unmount
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
