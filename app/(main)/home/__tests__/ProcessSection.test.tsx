import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ProcessSection from '../ProcessSection';

describe('ProcessSection — four onboarding steps', () => {
  it('renders the section with id="procesos" as the scroll-spy target', () => {
    const { container } = render(<ProcessSection />);
    const section = container.querySelector('section[id="procesos"]');
    expect(section).not.toBeNull();
  });

  it('renders the headline and the intro paragraph', () => {
    render(<ProcessSection />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Tu tienda online en 4 pasos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Empieza en minutos. Vende tú, nosotros nos encargamos del resto/),
    ).toBeInTheDocument();
  });

  it('renders the four step cards each with number, title and description', () => {
    render(<ProcessSection />);

    const steps = [
      {
        number: '1',
        title: 'Tu cuenta en 30 segundos',
        description: 'Entra con Google. Sin formularios largos ni verificación complicada.',
      },
      {
        number: '2',
        title: 'Tu tienda, tu estilo',
        description: 'Sube tu logo, elige colores y carga tu catálogo.',
      },
      {
        number: '3',
        title: 'Comparte y empieza a vender',
        description: 'Tu link listo. Instagram y redes conectadas para compartir sin esfuerzo.',
      },
      {
        number: '4',
        title: 'Pagos seguros con Culqi',
        description: 'El comprador paga, el dinero llega directo a tu cuenta.',
      },
    ];

    steps.forEach((step) => {
      expect(screen.getByText(step.number)).toBeInTheDocument();
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.description)).toBeInTheDocument();
    });
  });
});
