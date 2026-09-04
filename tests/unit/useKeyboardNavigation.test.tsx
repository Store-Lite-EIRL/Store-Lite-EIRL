import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import type { NavItemData } from '@/shared/components/navigation/types';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

interface NavHarnessProps {
  onActivate: (item: NavItemData) => void;
  onEscape: () => void;
}

// Mirrors production usage: the ref is attached through JSX during the
// render commit, which lets the hook's mount effect connect the listeners.
function NavHarness({ onActivate, onEscape }: NavHarnessProps) {
  const { containerRef } = useKeyboardNavigation(mockItems, onActivate, onEscape);

  return (
    <div data-testid="nav-container" ref={containerRef}>
      {mockItems.map((item) => (
        <button key={item.id} data-nav-item data-nav-id={item.id} tabIndex={-1} type="button">
          {item.label}
        </button>
      ))}
    </div>
  );
}

interface NavHarnessResult {
  onActivate: ReturnType<typeof vi.fn>;
  onEscape: ReturnType<typeof vi.fn>;
  container: HTMLDivElement;
  buttons: NodeListOf<HTMLButtonElement>;
}

function setup(): NavHarnessResult {
  const onActivate = vi.fn();
  const onEscape = vi.fn();

  render(<NavHarness onActivate={onActivate} onEscape={onEscape} />);

  const container = document.querySelector('[data-testid="nav-container"]') as HTMLDivElement;
  const buttons = container.querySelectorAll('[data-nav-item]') as NodeListOf<HTMLButtonElement>;

  return { onActivate, onEscape, container, buttons };
}

function focusContainer(container: HTMLDivElement, buttons: NodeListOf<HTMLButtonElement>): void {
  // In a real browser, focusin fires because focus enters the container
  // through the first item (Tab or click). Focus it to mirror that flow.
  act(() => {
    buttons[0].focus();
  });
}

function keydown(container: HTMLDivElement, key: string): void {
  act(() => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

describe('useKeyboardNavigation', () => {
  it('renders the nav items inside the ref-attached container', () => {
    const { container, buttons } = setup();

    expect(container).toBeDefined();
    expect(buttons).toHaveLength(3);
  });

  it('initializes roving tabindex on focus', () => {
    const { container, buttons } = setup();

    focusContainer(container, buttons);

    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');
    expect(buttons[2].getAttribute('tabindex')).toBe('-1');
  });

  it('ArrowDown moves focus to next item', () => {
    const { container, buttons } = setup();

    focusContainer(container, buttons);

    expect(document.activeElement).toBe(buttons[0]);

    keydown(container, 'ArrowDown');

    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ArrowUp moves focus to previous item', () => {
    const { container, buttons } = setup();

    focusContainer(container, buttons);

    // Move to second item first
    keydown(container, 'ArrowDown');

    expect(document.activeElement).toBe(buttons[1]);

    keydown(container, 'ArrowUp');

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ArrowDown wraps to first item at end', () => {
    const { container, buttons } = setup();

    focusContainer(container, buttons);

    keydown(container, 'ArrowDown');
    keydown(container, 'ArrowDown');

    expect(document.activeElement).toBe(buttons[2]);

    // Press ArrowDown again - should wrap to first
    keydown(container, 'ArrowDown');

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ArrowUp wraps to last item at beginning', () => {
    const { container, buttons } = setup();

    focusContainer(container, buttons);

    expect(document.activeElement).toBe(buttons[0]);

    // Press ArrowUp - should wrap to last
    keydown(container, 'ArrowUp');

    expect(document.activeElement).toBe(buttons[2]);
  });

  it('Home moves focus to first item', () => {
    const { container, buttons } = setup();

    focusContainer(container, buttons);

    // Move to last item
    keydown(container, 'End');

    expect(document.activeElement).toBe(buttons[2]);

    keydown(container, 'Home');

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('End moves focus to last item', () => {
    const { container, buttons } = setup();

    focusContainer(container, buttons);

    expect(document.activeElement).toBe(buttons[0]);

    keydown(container, 'End');

    expect(document.activeElement).toBe(buttons[2]);
  });

  it('Enter activates focused item', () => {
    const { container, buttons, onActivate } = setup();

    focusContainer(container, buttons);

    expect(document.activeElement).toBe(buttons[0]);

    keydown(container, 'Enter');

    expect(onActivate).toHaveBeenCalledWith(mockItems[0]);
  });

  it('Space activates focused item', () => {
    const { container, buttons, onActivate } = setup();

    focusContainer(container, buttons);

    // Move to second item
    keydown(container, 'ArrowDown');

    expect(document.activeElement).toBe(buttons[1]);

    keydown(container, ' ');

    expect(onActivate).toHaveBeenCalledWith(mockItems[1]);
  });

  it('Escape calls onEscape', () => {
    const { container, buttons, onEscape } = setup();

    focusContainer(container, buttons);

    keydown(container, 'Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('ignores keydown events that do not bubble through the container', () => {
    const { buttons } = setup();

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    });

    // Focus must not have moved: the container never received the event
    expect(document.activeElement).not.toBe(buttons[0]);
  });
});
