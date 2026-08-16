import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FooterSection from '../FooterSection';

describe('FooterSection', () => {
  it('links "Política de reembolsos" to /devoluciones', () => {
    render(<FooterSection />);
    const link = screen.getByRole('link', { name: 'Política de reembolsos' });
    expect(link).toHaveAttribute('href', '/devoluciones');
  });

  it('includes "Libro de Reclamaciones" linking to /libro-reclamaciones', () => {
    render(<FooterSection />);
    const link = screen.getByRole('link', { name: 'Libro de Reclamaciones' });
    expect(link).toHaveAttribute('href', '/libro-reclamaciones');
  });

  it('shows the updated phone number with tel: link', () => {
    render(<FooterSection />);
    expect(screen.getByText(/958 119 418/)).toBeInTheDocument();
    const phoneLink = screen.getByRole('link', { name: /958 119 418/ });
    expect(phoneLink).toHaveAttribute('href', 'tel:+51958119418');
  });

  it('shows the address line "Arequipa, Arequipa, Ciudad de Dios"', () => {
    render(<FooterSection />);
    expect(screen.getByText(/Arequipa, Arequipa, Ciudad de Dios/)).toBeInTheDocument();
  });

  it('retains the general contact email devkittopsac@gmail.com', () => {
    render(<FooterSection />);
    const emailLink = screen.getByRole('link', { name: /devkittopsac@gmail.com/ });
    expect(emailLink).toHaveAttribute('href', 'mailto:devkittopsac@gmail.com');
  });
});
