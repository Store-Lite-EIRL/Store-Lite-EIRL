import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HeroSection from '../HeroSection';

describe('HeroSection — hero copy, CTAs and feature cards', () => {
  it('renders the section with id="inicio" as the scroll-spy target', () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector('section[id="inicio"]');
    expect(section).not.toBeNull();
  });

  it('renders the display headline and the subtitle paragraph', () => {
    render(<HeroSection />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tu vitrina digital, lista para vender desde el día uno',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Store Lite te da todo lo que necesitas para que tu marca se vea profesional/,
      ),
    ).toBeInTheDocument();
  });

  it('renders both CTAs with their target hrefs', () => {
    render(<HeroSection />);

    const primary = screen.getByRole('link', { name: 'Crear mi tienda gratis' });
    expect(primary).toHaveAttribute('href', '/auth');

    const outline = screen.getByRole('link', { name: 'Ver planes' });
    expect(outline).toHaveAttribute('href', '#planes');
  });

  it('renders the three feature cards with titles and descriptions from the mockup', () => {
    render(<HeroSection />);

    expect(screen.getByText('Setup simple')).toBeInTheDocument();
    expect(
      screen.getByText('Publica tu tienda y empieza a cobrar sin curva de aprendizaje.'),
    ).toBeInTheDocument();

    expect(screen.getByText('Operación clara')).toBeInTheDocument();
    expect(
      screen.getByText('Inventario, pedidos y comunicación en un solo flujo.'),
    ).toBeInTheDocument();

    expect(screen.getByText('Escala real')).toBeInTheDocument();
    expect(
      screen.getByText('Una base sólida para crecer sin rehacer todo después.'),
    ).toBeInTheDocument();
  });

  it('marks all three feature cards as active with the green live badge', () => {
    render(<HeroSection />);
    expect(screen.getAllByText('Activo')).toHaveLength(3);
  });

  it('mounts the ProductFrame dashboard mockup inside the hero grid', () => {
    render(<HeroSection />);

    expect(screen.getByText('Panel de mi tienda')).toBeInTheDocument();
    expect(screen.getByText('S/ 1,240')).toBeInTheDocument();
    expect(screen.getAllByTestId('chart-bar')).toHaveLength(7);
    expect(screen.getAllByText('Pagado')).toHaveLength(3);
  });
});
