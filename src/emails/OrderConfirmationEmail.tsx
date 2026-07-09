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
  customerDni?: string;
  paymentMethod?: string;
}

export function OrderConfirmationEmail({
  businessName,
  orderNumber,
  date,
  productSummary,
  total,
  trackingUrl,
  customerName,
  customerDni,
  paymentMethod,
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

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #d4d4d8', margin: '0 0 16px' }} />

        {/* Product + Total row */}
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
