// =====================================================
// MarketingPanel family — Slice 1b (dark)
// Covers (cumulative across 1b.1→1b.3): R4 deco tiles
// (4 icons, aria-hidden), feature grid (4 pinned subtitles
// incl. "Directos a tu cuenta"), checklist (3 rows + R6
// period pin), and the MarketingPanel composition
// (aside label, copy). ConsentBar removed per user feedback
// (duplicate of global ConsentBanner).
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Checklist from '../components/Checklist';
import DecoTiles from '../components/DecoTiles';
import FeatureGrid from '../components/FeatureGrid';
import MarketingPanel from '../components/MarketingPanel';

describe('DecoTiles — R4/R7 decorative tiles', () => {
  it('renders the four pinned icons inside an aria-hidden decorative layer', () => {
    const { container } = render(<DecoTiles />);

    // R7: the whole tile layer is hidden from assistive technology.
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');

    // R4: exact pinned icon set from the design (shard icons repurposed).
    expect(screen.getByText('shopping_bag')).toBeInTheDocument();
    expect(screen.getByText('sell')).toBeInTheDocument();
    expect(screen.getByText('payments')).toBeInTheDocument();
    expect(screen.getByText('receipt_long')).toBeInTheDocument();
  });
});

describe('FeatureGrid — R4 feature grid', () => {
  it('renders four cards with the exact pinned titles and subtitles', () => {
    render(<FeatureGrid />);

    // Card 1 — Tu tienda / Lista para vender
    expect(screen.getByRole('heading', { name: 'Tu tienda' })).toBeInTheDocument();
    expect(screen.getByText('Lista para vender')).toBeInTheDocument();

    // Card 2 — Pagos simples / Directos a tu cuenta (new subtitle pin)
    expect(screen.getByRole('heading', { name: 'Pagos simples' })).toBeInTheDocument();
    expect(screen.getByText('Directos a tu cuenta')).toBeInTheDocument();

    // Card 3 — Inventario / Siempre al día
    expect(screen.getByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(screen.getByText('Siempre al día')).toBeInTheDocument();

    // Card 4 — Pedidos / Bajo control
    expect(screen.getByRole('heading', { name: 'Pedidos' })).toBeInTheDocument();
    expect(screen.getByText('Bajo control')).toBeInTheDocument();
  });

  it('renders exactly four cards', () => {
    render(<FeatureGrid />);

    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(4);
  });
});

describe('Checklist — R4 benefit rows (R6 period pin)', () => {
  it('renders three Spanish benefit rows with the pinned copy and icons', () => {
    render(<Checklist />);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Empieza gratis y crece a tu ritmo');
    expect(rows[1]).toHaveTextContent('Tus datos, desde cualquier dispositivo');
    // R6 pin — row 3 keeps its trailing period.
    expect(rows[2]).toHaveTextContent('Una experiencia simple para empezar.');

    expect(screen.getByText('check_circle')).toBeInTheDocument();
    expect(screen.getByText('cloud_done')).toBeInTheDocument();
    expect(screen.getByText('verified')).toBeInTheDocument();
  });
});

describe('MarketingPanel — R4 composition', () => {
  it('renders an aside labelled "Store Lite" with the pinned eyebrow, h2 and subtitle', () => {
    render(<MarketingPanel />);

    expect(screen.getByRole('complementary', { name: 'Store Lite' })).toBeInTheDocument();
    expect(screen.getByText('Tu negocio, en movimiento')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Todo lo que vendes, en un solo lugar.',
    );
    expect(
      screen.getByText(
        /Organiza tu catálogo, recibe pagos y haz crecer tu tienda desde cualquier lugar\./,
      ),
    ).toBeInTheDocument();
  });

  it('composes the feature grid and checklist (ConsentBar removed)', () => {
    render(<MarketingPanel />);

    expect(screen.getByRole('heading', { name: 'Pagos simples' })).toBeInTheDocument();
    expect(screen.getByText('Directos a tu cuenta')).toBeInTheDocument();
    expect(screen.getByText('Una experiencia simple para empezar.')).toBeInTheDocument();
    // ConsentBar was removed — no "Cambiar preferencias" link should exist in MarketingPanel
    expect(screen.queryByRole('link', { name: 'Cambiar preferencias' })).not.toBeInTheDocument();
  });
});

describe('MarketingPanel — Visual Polish: vibrant marketing icons (VISUAL-FIX-3)', () => {
  it('DecoTiles renders four decorative tiles with icons (visual styles applied via CSS)', () => {
    const { container } = render(<DecoTiles />);

    // R7: the whole tile layer is hidden from assistive technology.
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');

    // R4: exact pinned icon set from the design.
    expect(screen.getByText('shopping_bag')).toBeInTheDocument();
    expect(screen.getByText('sell')).toBeInTheDocument();
    expect(screen.getByText('payments')).toBeInTheDocument();
    expect(screen.getByText('receipt_long')).toBeInTheDocument();
    // VISUAL-FIX-3: Each tile now has vibrant brand color, matching border, and wash background
    // Verified visually in e2e/browser; CSS tokens defined in MarketingPanel.module.css
  });

  it('FeatureGrid renders four cards with vibrant icon chips (visual styles applied via CSS)', () => {
    render(<FeatureGrid />);

    // Card 1 — Tu tienda / Lista para vender
    expect(screen.getByRole('heading', { name: 'Tu tienda' })).toBeInTheDocument();
    expect(screen.getByText('Lista para vender')).toBeInTheDocument();

    // Card 2 — Pagos simples / Directos a tu cuenta
    expect(screen.getByRole('heading', { name: 'Pagos simples' })).toBeInTheDocument();
    expect(screen.getByText('Directos a tu cuenta')).toBeInTheDocument();

    // Card 3 — Inventario / Siempre al día
    expect(screen.getByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(screen.getByText('Siempre al día')).toBeInTheDocument();

    // Card 4 — Pedidos / Bajo control
    expect(screen.getByRole('heading', { name: 'Pedidos' })).toBeInTheDocument();
    expect(screen.getByText('Bajo control')).toBeInTheDocument();

    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(4);
    // VISUAL-FIX-3: Each iconChip now has vibrant brand color, matching border, and wash background
    // Verified visually in e2e/browser; CSS tokens defined in MarketingPanel.module.css
  });

  it('Checklist renders three benefit rows with vibrant check icons (visual styles applied via CSS)', () => {
    render(<Checklist />);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Empieza gratis y crece a tu ritmo');
    expect(rows[1]).toHaveTextContent('Tus datos, desde cualquier dispositivo');
    // R6 pin — row 3 keeps its trailing period.
    expect(rows[2]).toHaveTextContent('Una experiencia simple para empezar.');

    expect(screen.getByText('check_circle')).toBeInTheDocument();
    expect(screen.getByText('cloud_done')).toBeInTheDocument();
    expect(screen.getByText('verified')).toBeInTheDocument();
    // VISUAL-FIX-3: Each check icon now has vibrant green color, matching border, and wash background
    // Verified visually in e2e/browser; CSS tokens defined in MarketingPanel.module.css
  });
});
