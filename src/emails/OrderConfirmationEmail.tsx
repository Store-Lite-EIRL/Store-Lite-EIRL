import { Heading, Section, Text } from '@react-email/components';
import { EmailButton } from './components/button';
import { Layout } from './components/layout';

interface OrderConfirmationEmailProps {
  businessName: string;
  orderNumber: string;
  date: string;
  productSummary: string;
  total: string;
  trackingUrl: string;
  customerName?: string;
}

export function OrderConfirmationEmail({
  businessName,
  orderNumber,
  date,
  productSummary,
  total,
  trackingUrl,
  customerName,
}: OrderConfirmationEmailProps) {
  return (
    <Layout previewText="Tu compra ha sido confirmada" businessName={businessName}>
      <Heading
        style={{
          fontSize: '20px',
          color: '#18181b',
          margin: '0 0 4px',
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        {customerName ? `¡Gracias, ${customerName}!` : '¡Compra confirmada!'}
      </Heading>

      <Text
        style={{
          fontSize: '14px',
          color: '#52525b',
          margin: '0 0 24px',
          textAlign: 'center',
        }}
      >
        Tu compra en <strong>{businessName}</strong> está lista.
      </Text>

      {/* ── Ticket Card ── */}
      <Section
        style={{
          border: '1px solid #e4e4e7',
          borderRadius: '12px',
          padding: '24px',
          margin: '0 0 20px',
        }}
      >
        <Text
          style={{
            fontSize: '11px',
            color: '#a1a1aa',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600',
            margin: '0 0 4px',
          }}
        >
          Nro. de orden
        </Text>
        <Text
          style={{
            fontSize: '20px',
            color: '#18181b',
            fontWeight: '700',
            margin: '0 0 2px',
          }}
        >
          {orderNumber}
        </Text>
        <Text
          style={{
            fontSize: '13px',
            color: '#71717a',
            margin: '0 0 20px',
          }}
        >
          {date}
        </Text>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #d4d4d8', margin: '0 0 16px' }} />

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  fontSize: '12px',
                  color: '#71717a',
                  padding: '0 0 4px',
                  textAlign: 'left',
                  fontWeight: '400',
                }}
              >
                Producto
              </th>
              <th
                style={{
                  fontSize: '12px',
                  color: '#71717a',
                  padding: '0 0 4px',
                  textAlign: 'right',
                  fontWeight: '400',
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  fontSize: '14px',
                  color: '#18181b',
                  fontWeight: '600',
                  padding: '0',
                  width: '60%',
                }}
              >
                {productSummary}
              </td>
              <td
                style={{
                  fontSize: '16px',
                  color: '#18181b',
                  fontWeight: '700',
                  padding: '0',
                  textAlign: 'right',
                  width: '40%',
                }}
              >
                {total}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* ── Button ── */}
      <Section style={{ textAlign: 'center', margin: '0 0 20px' }}>
        <EmailButton href={trackingUrl}>Abrir pedido &rarr;</EmailButton>
      </Section>

      {/* ── Tip ── */}
      <Section
        style={{
          backgroundColor: '#f4f4f5',
          borderRadius: '8px',
          padding: '12px 16px',
          textAlign: 'center',
        }}
      >
        <Text
          style={{
            fontSize: '13px',
            color: '#52525b',
            margin: '0',
          }}
        >
          Podés seguir el estado de tu pedido en tiempo real desde &ldquo;Abrir pedido&rdquo;.
        </Text>
      </Section>
    </Layout>
  );
}
