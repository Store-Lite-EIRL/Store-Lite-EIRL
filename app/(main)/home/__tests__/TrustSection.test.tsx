import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TrustSection from '../TrustSection';

describe('TrustSection — security and trust badges', () => {
  it('renders the headline and the intro paragraph', () => {
    render(<TrustSection />);

    expect(screen.getByRole('heading', { level: 2, name: 'Confía tranquilo' })).toBeInTheDocument();
    expect(screen.getByText(/Tu negocio y tus clientes están protegidos/)).toBeInTheDocument();
  });

  it('renders the four trust items with icon, title and description', () => {
    render(<TrustSection />);

    const items = [
      { icon: 'lock', title: 'Pagos seguros', description: 'Procesado por Culqi (PCI DSS).' },
      {
        icon: 'shield',
        title: 'Datos seguros',
        description: 'Encriptación SSL y almacenamiento seguro.',
      },
      { icon: 'verified', title: 'Legalizado', description: 'Cumple con normativas SUNAT.' },
      { icon: 'autorenew', title: 'Sin permanencia', description: 'Cancela cuando quieras.' },
    ];

    items.forEach((item) => {
      expect(screen.getByText(item.icon)).toBeInTheDocument();
      expect(screen.getByText(item.title)).toBeInTheDocument();
      expect(screen.getByText(item.description)).toBeInTheDocument();
    });
  });
});
