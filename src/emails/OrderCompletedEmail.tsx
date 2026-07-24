import { Heading, Section, Text } from '@react-email/components';
import { EmailButton } from './components/button';
import { Layout } from './components/layout';

interface OrderCompletedEmailProps {
  businessName: string;
  orderNumber: string;
  date: string;
  trackingUrl: string;
  customerName?: string;
  customerDni?: string;
  paymentMethod?: string;
}

export function OrderCompletedEmail({
  businessName,
  orderNumber,
  date,
  trackingUrl,
  customerName,
  customerDni,
  paymentMethod,
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
        {/* Order number + date header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
          }}
        >
          <div>
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
                margin: '0',
              }}
            >
              {orderNumber}
            </Text>
          </div>
          <Text
            style={{
              fontSize: '13px',
              color: '#71717a',
              margin: '0',
              textAlign: 'right',
            }}
          >
            {date}
          </Text>
        </div>

        {/* DNI + Payment method */}
        {(customerDni || paymentMethod) && (
          <>
            <div style={{ borderTop: '1px dashed #d4d4d8', margin: '16px 0' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {customerDni && (
                  <tr>
                    <td
                      style={{
                        fontSize: '12px',
                        color: '#71717a',
                        padding: '0 0 6px',
                        fontWeight: '400',
                        width: '50%',
                      }}
                    >
                      DNI del comprador
                    </td>
                    <td
                      style={{
                        fontSize: '13px',
                        color: '#18181b',
                        padding: '0 0 6px',
                        fontWeight: '600',
                        textAlign: 'right',
                      }}
                    >
                      {customerDni}
                    </td>
                  </tr>
                )}
                {paymentMethod && (
                  <tr>
                    <td
                      style={{
                        fontSize: '12px',
                        color: '#71717a',
                        padding: '0',
                        fontWeight: '400',
                      }}
                    >
                      Método de pago
                    </td>
                    <td
                      style={{
                        fontSize: '13px',
                        color: '#18181b',
                        padding: '0',
                        fontWeight: '600',
                        textAlign: 'right',
                        textTransform: 'capitalize',
                      }}
                    >
                      {paymentMethod}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
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
