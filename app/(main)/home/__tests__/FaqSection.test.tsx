import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import FAQSection from '../FaqSection';

const QUESTIONS = [
  '¿Cuánto cuesta y hay comisiones ocultas?',
  '¿Necesito saber de programación o diseño?',
  '¿Cómo se verá mi tienda y qué link tendrá?',
  '¿Cómo recibo los pagos de mis clientes?',
  '¿Ofrezco envío a domicilio o recojo en tienda?',
  '¿Cuánto demora tener mi tienda lista?',
  '¿Puedo cambiar de plan o cancelar cuando quiera?',
  '¿Hay soporte mientras empiezo?',
] as const;

describe('FAQSection — native details accordion', () => {
  it('renders the eyebrow icon, headline and intro paragraph', () => {
    render(<FAQSection />);

    expect(screen.getByText('help')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Preguntas frecuentes' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Resolvemos las dudas más comunes/)).toBeInTheDocument();
  });

  it('renders eight FAQ items with an add icon each', () => {
    const { container } = render(<FAQSection />);

    const details = container.querySelectorAll('details');
    expect(details.length).toBe(8);
    expect(screen.getAllByText('add')).toHaveLength(8);
  });

  it('renders all eight questions as summaries', () => {
    render(<FAQSection />);

    QUESTIONS.forEach((question) => expect(screen.getByText(question)).toBeInTheDocument());
  });

  it('opens the first item by default and shows its answer', () => {
    const { container } = render(<FAQSection />);

    const details = container.querySelectorAll('details');
    expect(details[0]).toHaveAttribute('open');
    expect(
      screen.getByText(/Puedes crear tu tienda gratis y sin límite de tiempo/),
    ).toBeInTheDocument();
  });

  it('renders the subdomain preview as highlighted code inside the link answer', () => {
    const { container } = render(<FAQSection />);

    expect(screen.getByText('mitienda.storelite.app')).toBeInTheDocument();
    const code = container.querySelector('code');
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe('mitienda.storelite.app');
    // CSS-module class names are scoped in tests (e.g. _subdomain_<hash>), so match the project pattern.
    expect(code?.className).toContain('subdomain');
  });

  it('keeps the remaining items closed by default', () => {
    const { container } = render(<FAQSection />);

    const details = container.querySelectorAll('details');
    Array.from(details)
      .slice(1)
      .forEach((detail) => {
        expect(detail).not.toHaveAttribute('open');
      });
  });

  it('toggles an item open when its summary is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<FAQSection />);

    const details = container.querySelectorAll('details');
    const secondItem = details[1];
    expect(secondItem).not.toHaveAttribute('open');

    const summary = secondItem.querySelector('summary');
    expect(summary).not.toBeNull();
    await user.click(summary as HTMLElement);

    expect(secondItem).toHaveAttribute('open');
    expect(screen.getByText(/No\. Store Lite está pensado/)).toBeInTheDocument();
  });

  it('closes an open item when its summary is clicked again', async () => {
    const user = userEvent.setup();
    const { container } = render(<FAQSection />);

    const details = container.querySelectorAll('details');
    const firstItem = details[0];
    expect(firstItem).toHaveAttribute('open');

    const summary = firstItem.querySelector('summary');
    await user.click(summary as HTMLElement);

    expect(firstItem).not.toHaveAttribute('open');
  });
});
