import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HeroSection from '../HeroSection';

describe('HeroSection — hero copy, CTAs and feature cards', () => {
  it('renders the section with id="inicio" as the scroll-spy target', () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector('section[id="inicio"]');
    expect(section).not.toBeNull();
  });

  it('renders the display headline', () => {
    render(<HeroSection />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Enfócate en vender con Store Lite');
  });

  it('renders both CTAs with their target hrefs', () => {
    render(<HeroSection />);

    const primary = screen.getByRole('link', { name: 'Crear mi tienda gratis' });
    expect(primary).toHaveAttribute('href', '/auth');

    const outline = screen.getByRole('link', { name: 'Ver planes' });
    expect(outline).toHaveAttribute('href', '#pricing');
  });

  it('mounts the ProductFrame dashboard mockup inside the hero grid', () => {
    render(<HeroSection />);

    expect(screen.getByText('Panel de mi tienda')).toBeInTheDocument();
    expect(screen.getByText('S/ 1,240')).toBeInTheDocument();
    expect(screen.getAllByTestId('chart-bar')).toHaveLength(7);
    expect(screen.getAllByText('Pagado')).toHaveLength(3);
  });
});
