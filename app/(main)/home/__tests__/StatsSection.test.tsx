import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StatsSection from '../StatsSection';

describe('StatsSection — traction stat cards', () => {
  it('renders the headline and the intro paragraph', () => {
    render(<StatsSection />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Lo que va generando' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Acabamos de arrancar y ya tenemos tracción/)).toBeInTheDocument();
  });

  it('renders the four stat cards with number and label from the mockup', () => {
    render(<StatsSection />);

    const stats = [
      { value: '50+', label: 'Tiendas activas' },
      { value: '2K+', label: 'Productos publicados' },
      { value: '99%', label: 'Uptime' },
      { value: '24h', label: 'Soporte' },
    ];

    stats.forEach((stat) => {
      expect(screen.getByText(stat.value)).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    });
  });

  it('renders the growth note with the trending_up icon', () => {
    render(<StatsSection />);

    expect(screen.getByText('Nuevas tiendas cada semana · seguimos creciendo')).toBeInTheDocument();
    // Two trending_up icons: one in the heading, one in the note
    expect(screen.getAllByText('trending_up')).toHaveLength(2);
  });
});
