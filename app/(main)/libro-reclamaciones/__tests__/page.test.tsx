import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ComplaintBookPage, { metadata } from '../page';

vi.mock('../ComplaintForm', () => ({
  ComplaintForm: () => <div data-testid="complaint-form" />,
}));

describe('ComplaintBookPage (platform)', () => {
  it('renders publicly without authentication or slug requirements', () => {
    render(<ComplaintBookPage />);
    expect(screen.getByRole('heading', { name: 'Libro de Reclamaciones' })).toBeInTheDocument();
    expect(screen.getByTestId('complaint-form')).toBeInTheDocument();
  });

  it('states the 15-business-day response window and DS 011-2011-PCM', () => {
    render(<ComplaintBookPage />);
    expect(screen.getByText(/15 días hábiles/i)).toBeInTheDocument();
    expect(screen.getByText(/DS 011-2011-PCM/i)).toBeInTheDocument();
  });

  it('does not embed or link external forms or third-party services', () => {
    const { container } = render(<ComplaintBookPage />);
    const hasExternal = container.querySelector('iframe');
    expect(hasExternal).toBeNull();
    const links = screen.queryAllByRole('link');
    expect(
      links.some((l) => (l.getAttribute('href') ?? '').startsWith('https://docs.google.com')),
    ).toBe(false);
    expect(links.some((l) => (l.getAttribute('href') ?? '').startsWith('https://forms.gle'))).toBe(
      false,
    );
  });

  it('exposes indexable metadata', () => {
    const robots = metadata.robots as { index?: boolean; follow?: boolean } | undefined;
    expect(metadata.title).toContain('Libro de Reclamaciones');
    expect(metadata.description).toContain('reclamo');
    expect(robots?.index).toBe(true);
    expect(robots?.follow).toBe(true);
  });
});
