import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TerminosPage from '../page';

describe('TerminosPage', () => {
  it('states plans are paid manually each month with no recurring charge', () => {
    render(<TerminosPage />);
    expect(screen.getByText(/pagan de forma manual cada mes/i)).toBeInTheDocument();
    expect(screen.getByText(/sin renovación automática/i)).toBeInTheDocument();
  });

  it('does not claim automatic renewal', () => {
    render(<TerminosPage />);
    expect(screen.queryByText(/renuevan automáticamente/i)).not.toBeInTheDocument();
  });

  it('identifies the provider by legal identity name and RUC', () => {
    render(<TerminosPage />);
    expect(screen.getAllByText(/MAMANI TACORA ERNESTO ALONSO/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/RUC 10741399852/).length).toBeGreaterThan(0);
  });

  it('does not use the SAC legal form', () => {
    render(<TerminosPage />);
    expect(screen.queryByText(/SAC/)).not.toBeInTheDocument();
  });

  it('shows the updated contact phone number', () => {
    render(<TerminosPage />);
    expect(screen.getByText(/958 119 418/)).toBeInTheDocument();
  });
});
