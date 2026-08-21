import { StoreLogo } from '@/shared/components/ui/data-display/StoreLogo';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('StoreLogo', () => {
  it('renders the brand name with a space between Store and Lite', () => {
    render(<StoreLogo />);

    expect(screen.getByText('Store Lite')).toBeInTheDocument();
    expect(screen.queryByText('Store.Lite')).not.toBeInTheDocument();
  });

  it('renders the icon image from /img/icon.png with accessible alt text', () => {
    render(<StoreLogo />);

    const icon = screen.getByRole('img', { name: 'Store Lite' });
    expect(icon.getAttribute('src')).toContain('icon.png');
  });

  it('applies the requested size to the icon image', () => {
    render(<StoreLogo size={48} />);

    const icon = screen.getByRole('img', { name: 'Store Lite' });
    expect(icon).toHaveAttribute('width', '48');
    expect(icon).toHaveAttribute('height', '48');
  });

  it('hides the brand text in iconOnly mode while keeping the icon', () => {
    render(<StoreLogo iconOnly />);

    expect(screen.queryByText('Store Lite')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Store Lite' })).toBeInTheDocument();
  });

  it('keeps the brand text visible in the white variant', () => {
    render(<StoreLogo variant="white" />);

    expect(screen.getByText('Store Lite')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Store Lite' })).toBeInTheDocument();
  });
});
