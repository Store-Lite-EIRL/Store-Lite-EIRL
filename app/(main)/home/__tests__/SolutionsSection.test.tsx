import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SolutionsSection from '../SolutionsSection';

describe('SolutionsSection — problem/solution cards and integrations', () => {
  it('renders the section with id="soluciones" as the scroll-spy target', () => {
    const { container } = render(<SolutionsSection />);
    const section = container.querySelector('section[id="soluciones"]');
    expect(section).not.toBeNull();
  });

  it('renders the intro paragraph without eyebrow icon or h2', () => {
    render(<SolutionsSection />);

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
      'Integra tu WhatsApp directamente',
    ];
    const fixes = [
      'Empieza gratis, sin mensualidad ni sorpresas.',
      'Pagos directos y seguros, integrados con Culqi.',
      'Supervisa pedidos desde que los envías hasta que llegan a tus usuarios. Más seguridad y tranquilidad para tus clientes.',
      'Tu catálogo siempre al día, sin esfuerzo.',
      'En tiempo real puedes estar en contacto con tus usuarios porque tenemos chats en tiempo real.',
      'Conecta WhatsApp a la misma tienda y podrás responder a tus clientes en tiempo real, sin perder ventas.',
    ];
    const icons = ['rocket_launch', 'payments', 'local_shipping', 'inventory_2', 'insights', 'hub'];

    issues.forEach((issue) => expect(screen.getByText(issue)).toBeInTheDocument());
    fixes.forEach((fix) => expect(screen.getByText(fix)).toBeInTheDocument());

    icons.forEach((icon) => {
      const elements = screen.getAllByText(icon);
      const expectedLength = icon === 'hub' ? 2 : 1;
      expect(elements).toHaveLength(expectedLength);
    });
    expect(screen.getAllByText('check_circle')).toHaveLength(6);
  });

  it('renders the five integration chips with name and category', () => {
    render(<SolutionsSection />);

    expect(screen.getByText('Culqi')).toBeInTheDocument();
    expect(screen.getByText('Pagos')).toBeInTheDocument();
    expect(screen.getByText('0 comisiones')).toBeInTheDocument();
    expect(screen.getByText('Por venta')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Atención')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Subdominio')).toBeInTheDocument();
    expect(screen.getByText('Edita tu negocio')).toBeInTheDocument();
    expect(screen.getByText('A tu comodidad')).toBeInTheDocument();
  });

  it('renders the five integration icons and the "more integrations" note', () => {
    render(<SolutionsSection />);

    const intIcons = ['credit_card', 'percent', 'chat', 'travel_explore', 'edit'];
    intIcons.forEach((icon) => expect(screen.getByText(icon)).toBeInTheDocument());
    expect(screen.getByText('+ Más integraciones próximamente')).toBeInTheDocument();
  });
});
