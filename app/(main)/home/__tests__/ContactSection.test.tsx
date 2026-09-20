import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ContactSection from '../ContactSection';

describe('ContactSection — WhatsApp CTA card', () => {
  it('renders the section with id="contacto" as the scroll-spy target', () => {
    const { container } = render(<ContactSection />);
    const section = container.querySelector('section[id="contacto"]');
    expect(section).not.toBeNull();
  });

  it('renders the headline and the description', () => {
    render(<ContactSection />);

    expect(
      screen.getByRole('heading', { level: 3, name: '¿Hablamos por WhatsApp?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Te atiende un asistente real de Store Lite, no un bot/),
    ).toBeInTheDocument();
  });

  it('renders the WhatsApp CTA as a link with the WhatsApp SVG icon and the wa.me href', () => {
    render(<ContactSection />);

    const link = screen.getByRole('link', { name: /Escribir por WhatsApp/i });
    expect(link).toHaveAttribute('href', 'https://wa.me/51958119418');
    expect(link.querySelector('svg')).not.toBeNull();
  });

  it('renders the help list with four assistance items', () => {
    render(<ContactSection />);

    expect(screen.getByText('Elegir el plan ideal para tu negocio')).toBeInTheDocument();
    expect(screen.getByText('Configurar tu tienda paso a paso')).toBeInTheDocument();
    expect(screen.getByText('Resolver dudas de pagos y facturación')).toBeInTheDocument();
    expect(screen.getByText('Consejos para vender desde el primer día')).toBeInTheDocument();
    expect(screen.getAllByText('check')).toHaveLength(4);
  });

  it('assures no spam and real assistance', () => {
    render(<ContactSection />);

    expect(
      screen.getByText(/Sin spam\. Solo usamos tu número para responder tu consulta/),
    ).toBeInTheDocument();
    expect(screen.getByText('shield')).toBeInTheDocument();
  });
});
