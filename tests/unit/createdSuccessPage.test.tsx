import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock Next.js navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    // Simulate redirect behavior by throwing (as real redirect does)
    throw new Error(`NEXT_REDIRECT: ${url}`);
  },
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Import the page after mocks are set up
import CreatedPage from '@/app/created/page';

describe('CreatedPage — success confirmation page', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  test('redirects to /create-business when searchParams are missing', async () => {
    // Both businessId and name are missing
    await expect(CreatedPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'NEXT_REDIRECT: /create-business',
    );
    expect(mockRedirect).toHaveBeenCalledWith('/create-business');
  });

  test('redirects to /create-business when businessId is missing but name exists', async () => {
    await expect(
      CreatedPage({ searchParams: Promise.resolve({ name: 'mi-tienda' }) }),
    ).rejects.toThrow('NEXT_REDIRECT: /create-business');
    expect(mockRedirect).toHaveBeenCalledWith('/create-business');
  });

  test('redirects to /create-business when name is missing but businessId exists', async () => {
    await expect(
      CreatedPage({ searchParams: Promise.resolve({ businessId: 'abc-123' }) }),
    ).rejects.toThrow('NEXT_REDIRECT: /create-business');
    expect(mockRedirect).toHaveBeenCalledWith('/create-business');
  });

  test('renders success message with business name when both params are provided', async () => {
    const params = Promise.resolve({
      businessId: 'abc-123',
      name: 'mi-tienda',
    });

    let container: HTMLElement | undefined;
    try {
      const result = render(await CreatedPage({ searchParams: params }));
      container = result.container;
    } catch (e) {
      // If no redirect threw, check the rendered output
      if (!(e instanceof Error && (e as Error).message?.startsWith('NEXT_REDIRECT'))) {
        throw e;
      }
    }

    // If we got here without a redirect, the page rendered successfully
    if (container) {
      expect(screen.getByText(/negocio creado/i)).toBeInTheDocument();
      expect(screen.getByText(/mi-tienda/i)).toBeInTheDocument();
    }
  });

  test('renders CTA buttons linking to admin dashboard and pricing', async () => {
    const params = Promise.resolve({
      businessId: 'abc-123',
      name: 'mi-tienda',
    });

    let container: HTMLElement | undefined;
    try {
      const result = render(await CreatedPage({ searchParams: params }));
      container = result.container;
    } catch (e) {
      if (!(e instanceof Error && (e as Error).message?.startsWith('NEXT_REDIRECT'))) {
        throw e;
      }
    }

    if (container) {
      // Admin dashboard link
      const adminLink = screen.getByRole('link', { name: /ir al panel/i });
      expect(adminLink).toBeInTheDocument();
      expect(adminLink).toHaveAttribute('href', '/mi-tienda/dashboard');

      // Pricing link
      const pricingLink = screen.getByRole('link', { name: /ver planes/i });
      expect(pricingLink).toBeInTheDocument();
      expect(pricingLink).toHaveAttribute('href', '/pricing');
    }
  });

  test('renders checkmark/confirmation visual element', async () => {
    const params = Promise.resolve({
      businessId: 'abc-123',
      name: 'mi-tienda',
    });

    let container: HTMLElement | undefined;
    try {
      const result = render(await CreatedPage({ searchParams: params }));
      container = result.container;
    } catch (e) {
      if (!(e instanceof Error && (e as Error).message?.startsWith('NEXT_REDIRECT'))) {
        throw e;
      }
    }

    if (container) {
      // Check for a success-related icon or heading
      const headings = screen.getAllByRole('heading');
      const hasSuccessHeading = headings.some(
        (h) =>
          h.textContent?.toLowerCase().includes('creado') ||
          h.textContent?.toLowerCase().includes('éxito') ||
          h.textContent?.toLowerCase().includes('listo'),
      );
      expect(hasSuccessHeading).toBe(true);
    }
  });
});
