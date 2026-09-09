import {
  calculateTicketHeight,
  ServerTicket,
  type ServerTicketData,
} from '@/shared/payments/serverTicketRenderer';
import { describe, expect, it } from 'vitest';

describe('serverTicketRenderer', () => {
  const mockData: ServerTicketData = {
    businessName: 'Tienda Oficial Test',
    businessRuc: '20123456789',
    businessAddress: 'Av. Siempre Viva 742',
    orderNumber: 'ORD-98765',
    date: new Date('2026-09-07T12:00:00Z'),
    items: [
      { name: 'Producto A', quantity: 2, price: 50 },
      { name: 'Producto B', quantity: 1, price: 30 },
    ],
    totalAmount: 130,
    currency: 'PEN',
    paymentMethod: 'Tarjeta',
    customerDni: '12345678',
    customerEmail: 'cliente@test.com',
    qrCodeDataUrl: 'data:image/png;base64,mockqr',
  };

  it('calculates ticket height dynamically based on items and sections', () => {
    const height = calculateTicketHeight(mockData);
    expect(height).toBeGreaterThanOrEqual(680);

    const dataManyItems = {
      ...mockData,
      items: Array.from({ length: 10 }, (_, i) => ({
        name: `Producto ${i}`,
        quantity: 1,
        price: 10,
      })),
    };
    const heightMany = calculateTicketHeight(dataManyItems);
    expect(heightMany).toBeGreaterThan(height);
  });

  it('renders ServerTicket component without throwing', () => {
    const element = ServerTicket({ data: mockData });
    expect(element).toBeDefined();
    expect(element.props.style).toBeDefined();
  });
});
