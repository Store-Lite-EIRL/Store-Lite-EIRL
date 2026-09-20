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
      screen.getByRole('heading', { level: 3, name: '¿Tienes dudas antes de empezar?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Escríbenos y te ayudamos a elegir el plan correcto para tu negocio/),
    ).toBeInTheDocument();
  });

  it('renders the WhatsApp CTA as a link with the chat icon and the wa.me href', () => {
    render(<ContactSection />);

    const link = screen.getByRole('link', { name: /Escribir por WhatsApp/i });
    expect(link).toHaveAttribute('href', 'https://wa.me/51958119418');
    expect(screen.getByText('chat')).toBeInTheDocument();
  });
});
