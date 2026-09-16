import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ProductFrame from '../ProductFrame';

describe('ProductFrame — dashboard mockup structure', () => {
  it('renders the topbar with three window dots, the panel title and the more_horiz icon', () => {
    const { container } = render(<ProductFrame />);

    expect(screen.getByText('Panel de mi tienda')).toBeInTheDocument();
    expect(screen.getAllByTestId('topbar-dot')).toHaveLength(3);
    expect(container.querySelector('.material-symbols-rounded')?.textContent).toBe('more_horiz');
  });

  it('renders the five sidebar icons (dashboard active, inventory, receipts, chat, settings)', () => {
    render(<ProductFrame />);

    const icons = ['dashboard', 'inventory_2', 'receipt_long', 'chat', 'settings'] as const;
    icons.forEach((icon) => {
      expect(screen.getByText(icon)).toBeInTheDocument();
    });
    expect(screen.getByText('dashboard')).toHaveClass('material-symbols-rounded');
  });

  it('renders the three metric cards with values and labels from the mockup', () => {
    render(<ProductFrame />);

    expect(screen.getByText('S/ 1,240')).toBeInTheDocument();
    expect(screen.getByText('Ventas hoy')).toBeInTheDocument();
    expect(screen.getByText('36')).toBeInTheDocument();
    expect(screen.getByText('Pedidos nuevos')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Visitas hoy')).toBeInTheDocument();
  });

  it('renders the chart with seven bars at the mockup heights (two highlighted)', () => {
    render(<ProductFrame />);

    const bars = screen.getAllByTestId('chart-bar');
    expect(bars).toHaveLength(7);

    // Bars are rendered at the mockup heights, in order.
    const [bar1, bar2, bar3, bar4, bar5, bar6, bar7] = bars;
    expect(bar1).toHaveStyle({ height: '35%' });
    expect(bar2).toHaveStyle({ height: '55%' });
    expect(bar3).toHaveStyle({ height: '85%' });
    expect(bar4).toHaveStyle({ height: '48%' });
    expect(bar5).toHaveStyle({ height: '64%' });
    expect(bar6).toHaveStyle({ height: '92%' });
    expect(bar7).toHaveStyle({ height: '40%' });

    // Bars 3 and 6 carry the highlighted variant style.
    expect(bar3.className).toContain('barHi');
    expect(bar6.className).toContain('barHi');
    expect(bar1.className).not.toContain('barHi');

    // The whole chart is decorative for assistive tech.
    expect(screen.getByTestId('chart')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the three paid order rows in order', () => {
    render(<ProductFrame />);

    expect(screen.getByText('Pedido #1042 · Ana R.')).toBeInTheDocument();
    expect(screen.getByText('Pedido #1041 · Carlos M.')).toBeInTheDocument();
    expect(screen.getByText('Pedido #1040 · Lucía P.')).toBeInTheDocument();
    expect(screen.getAllByText('Pagado')).toHaveLength(3);
  });

  it('keeps important text accessible while hiding decorative glyphs and dots', () => {
    const { container } = render(<ProductFrame />);

    // Every material-symbol glyph is decorative: the 5 side icons + more_horiz.
    const decorativeSymbols = container.querySelectorAll(
      '.material-symbols-rounded[aria-hidden="true"]',
    );
    expect(decorativeSymbols).toHaveLength(6);

    // The window dots are also hidden from the accessibility tree.
    expect(screen.getByTestId('topbar-dots')).toHaveAttribute('aria-hidden', 'true');

    // Core content stays reachable.
    expect(screen.getByText('S/ 1,240')).toBeInTheDocument();
    expect(screen.getAllByText('Pagado')).toHaveLength(3);
  });
});
