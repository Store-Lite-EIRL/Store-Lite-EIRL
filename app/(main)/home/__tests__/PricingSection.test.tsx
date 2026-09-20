import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import PricingSection from '../PricingSection';

describe('PricingSection — pricing plans with toggle', () => {
  it('renders the section with id="pricing" as the scroll-spy target', () => {
    const { container } = render(<PricingSection />);
    const section = container.querySelector('section[id="pricing"]');
    expect(section).not.toBeNull();
  });

  it('renders the headline and intro paragraph', () => {
    render(<PricingSection />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Encuentra el plan que hace crecer tu negocio',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Precios claros\. Sin letras chiquitas\. Empieza gratis/),
    ).toBeInTheDocument();
  });

  it('renders the billing toggle with Mensual and Anual options', () => {
    render(<PricingSection />);

    const mensual = screen.getByRole('button', { name: /mensual/i });
    const anual = screen.getByRole('button', { name: /anual/i });
    expect(mensual).toBeInTheDocument();
    expect(anual).toBeInTheDocument();
  });

  it('defaults to Mensual as the active toggle option', () => {
    render(<PricingSection />);

    const mensual = screen.getByRole('button', { name: /mensual/i });
    const anual = screen.getByRole('button', { name: /anual/i });
    expect(mensual).toHaveAttribute('aria-pressed', 'true');
    expect(anual).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches active toggle when Anual is clicked', async () => {
    const user = userEvent.setup();
    render(<PricingSection />);

    const anual = screen.getByRole('button', { name: /anual/i });
    await user.click(anual);

    expect(anual).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /mensual/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('renders both plans with name, price, and description', () => {
    render(<PricingSection />);

    expect(screen.getByRole('heading', { level: 3, name: 'Lite Pago' })).toBeInTheDocument();
    expect(screen.getByText('S/ 39')).toBeInTheDocument();
    expect(
      screen.getByText(/Para negocios que ya venden y quieren llevar su marca/),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: 'Lite Plus' })).toBeInTheDocument();
    expect(screen.getByText('S/ 79')).toBeInTheDocument();
    expect(screen.getByText(/Para marcas que necesitan el máximo rendimiento/)).toBeInTheDocument();
  });

  it('renders the "Más elegido" tag on the featured plan', () => {
    render(<PricingSection />);

    expect(screen.getByText('Más elegido')).toBeInTheDocument();
  });

  it('renders five features for each plan with check icons', () => {
    render(<PricingSection />);

    const litePagoFeatures = [
      'Pagos con tarjetas y billeteras digitales',
      'Hasta 300 productos publicados',
      'Dashboard con métricas de ventas',
      'Equipo de 2 usuarios adicionales',
    ];
    const litePlusFeatures = [
      'Dashboard avanzado con métricas en tiempo real',
      'Hasta 4 usuarios en el equipo',
      'Hasta 600 productos publicados',
      'Personalización completa del diseño',
    ];

    litePagoFeatures.forEach((f) => expect(screen.getByText(f)).toBeInTheDocument());
    litePlusFeatures.forEach((f) => expect(screen.getByText(f)).toBeInTheDocument());

    // 'SEO avanzado incluido' is shared by both plans — must appear exactly twice
    expect(screen.getAllByText('SEO avanzado incluido')).toHaveLength(2);

    const checkIcons = screen.getAllByText('check');
    expect(checkIcons.length).toBe(10);
  });

  it('renders the CTAs for each plan', () => {
    render(<PricingSection />);

    expect(screen.getByRole('link', { name: /Escalar mi negocio/i })).toHaveAttribute('href', '#');
    expect(screen.getByRole('link', { name: /Obtener máxima potencia/i })).toHaveAttribute(
      'href',
      '#',
    );
  });

  it('renders the plans note with benefits', () => {
    render(<PricingSection />);

    expect(screen.getByText(/Todos los planes incluyen dominio gratis/)).toBeInTheDocument();
  });
});
