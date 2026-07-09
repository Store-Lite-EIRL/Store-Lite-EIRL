import { Heading, Section, Text } from '@react-email/components';
import { EmailButton } from './components/button';
import { Layout } from './components/layout';

interface OrderCompletedEmailProps {
  businessName: string;
  orderNumber: string;
  date: string;
  trackingUrl: string;
  customerName?: string;
}

export function OrderCompletedEmail({
  businessName,
  orderNumber,
  date,
  trackingUrl,
  customerName,
}: OrderCompletedEmailProps) {
  return (
    <Layout previewText="Tu pedido ha sido completado" businessName={businessName}>
      <Heading
        style={{
          fontSize: '20px',
          color: '#18181b',
          margin: '0 0 4px',
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        {customerName ? `¡Recibido, ${customerName}!` : '¡Pedido completado!'}
      </Heading>

      <Text
        style={{
          fontSize: '14px',
          color: '#52525b',
          margin: '0 0 24px',
          textAlign: 'center',
        }}
      >
        El pedido de <strong>{businessName}</strong> se marcó como completado. ¡Gracias por tu
        compra!
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
            margin: '0',
          }}
        >
          {date}
        </Text>
      </Section>

      {/* ── Button ── */}
      <Section style={{ textAlign: 'center', margin: '0 0 20px' }}>
        <EmailButton href={trackingUrl}>Ver detalle del pedido &rarr;</EmailButton>
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
          ¿Te llegó todo bien? Si tenés alguna duda, contactá al vendedor directamente desde la
          página del pedido.
        </Text>
      </Section>
    </Layout>
  );
}
