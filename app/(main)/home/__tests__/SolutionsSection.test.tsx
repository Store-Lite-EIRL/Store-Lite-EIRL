import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SolutionsSection from '../SolutionsSection';

describe('SolutionsSection — problem/solution cards and integrations', () => {
  it('renders the section with id="soluciones" as the scroll-spy target', () => {
    const { container } = render(<SolutionsSection />);
    const section = container.querySelector('section[id="soluciones"]');
    expect(section).not.toBeNull();
  });

  it('renders the eyebrow icon, the headline and the intro paragraph', () => {
    render(<SolutionsSection />);

    expect(screen.getByText('bolt')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Deja de complicarte. Enfócate en vender.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Crear y mantener un ecommerce no debería ser un proyecto de ingeniería/),
    ).toBeInTheDocument();
  });

  it('renders the six problem/solution cards, each with icon, issue and fix', () => {
    render(<SolutionsSection />);

    const issues = [
      'Crear una tienda online cuesta caro y toma semanas.',
      'Te complicas con pagos y cobros.',
      'Gestionar envíos es un dolor de cabeza.',
      'Pierdes productos y stock en hojas de cálculo.',
      'No sabes qué está funcionando o qué no.',
      'Vender a la vez por redes y por web se vuelve un caos.',
    ];
    const fixes = [
      'Es gratis empezar. Sin mensualidad ni sorpresas.',
      'Pagos directos y seguros, integrados con Culqi.',
      'Todo desde la app. Control total sin salir de casa.',
      'Tu catálogo siempre al día, sin esfuerzo.',
      'Datos reales. Decisiones basadas en info, no en intuición.',
      'Conecta Instagram y WhatsApp a la misma tienda.',
    ];

    issues.forEach((issue) => expect(screen.getByText(issue)).toBeInTheDocument());
    fixes.forEach((fix) => expect(screen.getByText(fix)).toBeInTheDocument());

    const cardIcons = [
      'rocket_launch',
      'payments',
      'local_shipping',
      'inventory_2',
      'insights',
      'hub',
    ];
    cardIcons.forEach((icon) => expect(screen.getByText(icon)).toBeInTheDocument());
    expect(screen.getAllByText('check_circle')).toHaveLength(6);
  });

  it('renders the integrations title and the five integration chips with name and category', () => {
    render(<SolutionsSection />);

    expect(screen.getByText('Todo lo que necesitas, conectado')).toBeInTheDocument();
    expect(screen.getByText('Culqi')).toBeInTheDocument();
    expect(screen.getByText('Pagos')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Atención')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Dominio')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Datos')).toBeInTheDocument();
  });

  it('renders the five integration icons and the "more integrations" note', () => {
    render(<SolutionsSection />);

    const intIcons = ['credit_card', 'photo_camera', 'chat', 'travel_explore', 'query_stats'];
    intIcons.forEach((icon) => expect(screen.getByText(icon)).toBeInTheDocument());
    expect(screen.getByText('+ Más integraciones próximamente')).toBeInTheDocument();
  });
});
