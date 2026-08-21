import { Heading, Section, Text } from '@react-email/components';
import { EmailButton } from './components/button';
import { Layout } from './components/layout';

interface PlanPurchaseConfirmationEmailProps {
  businessName: string;
  planName: string;
  ticketNumber: string;
  amountTotal: string;
  planEndDate: string;
  ticketUrl?: string;
  customerFullName?: string;
  customerDocumentType?: string;
  customerDocumentNumber?: string;
}

export function PlanPurchaseConfirmationEmail({
  businessName,
  planName,
  ticketNumber,
  amountTotal,
  planEndDate,
  ticketUrl,
  customerFullName,
  customerDocumentType,
  customerDocumentNumber,
}: PlanPurchaseConfirmationEmailProps) {
  return (
    <Layout previewText="Tu boleta de compra de plan Store Lite" businessName={businessName}>
      <Heading
        style={{
          fontSize: '20px',
          color: '#18181b',
          margin: '0 0 4px',
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        {customerFullName ? `¡Gracias, ${customerFullName}!` : '¡Pago exitoso!'}
      </Heading>

      <Text
        style={{
          fontSize: '14px',
          color: '#52525b',
          margin: '0 0 24px',
          textAlign: 'center',
        }}
      >
        Tu plan <strong>{planName}</strong> ya está activo para <strong>{businessName}</strong>.
      </Text>

      {/* ── Boleta Card ── */}
      <Section
        style={{
          border: '1px solid #e4e4e7',
          borderRadius: '12px',
          padding: '24px',
          margin: '0 0 20px',
        }}
      >
        {/* Boleta number header */}
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
              Nro. de boleta
            </Text>
            <Text
              style={{
                fontSize: '20px',
                color: '#18181b',
                fontWeight: '700',
                margin: '0',
              }}
            >
              {ticketNumber}
            </Text>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #d4d4d8', margin: '0 0 16px' }} />

        {/* Plan + Total row */}
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
                Plan
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
                {planName}
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
                {amountTotal}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Documento del comprador */}
        {(customerDocumentType || customerDocumentNumber) && (
          <>
            <div style={{ borderTop: '1px dashed #d4d4d8', margin: '16px 0' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <th
                    scope="row"
                    style={{
                      fontSize: '12px',
                      color: '#71717a',
                      padding: '0',
                      fontWeight: '400',
                      textAlign: 'left',
                      width: '50%',
                    }}
                  >
                    Documento del comprador
                  </th>
                  <td
                    style={{
                      fontSize: '13px',
                      color: '#18181b',
                      padding: '0',
                      fontWeight: '600',
                      textAlign: 'right',
                    }}
                  >
                    {customerDocumentType ? `${customerDocumentType} ` : ''}
                    {customerDocumentNumber}
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </Section>

      {/* ── Plan activo hasta — destacado ── */}
      <Section
        style={{
          backgroundColor: '#eef2ff',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          border: '1px solid #c7d2fe',
          margin: '0 0 20px',
        }}
      >
        <Text
          style={{
            fontSize: '12px',
            color: '#6366f1',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600',
            margin: '0 0 4px',
          }}
        >
          Tu plan está activo hasta el
        </Text>
        <Text
          style={{
            fontSize: '18px',
            color: '#4f46e5',
            fontWeight: '700',
            margin: '0',
          }}
        >
          {planEndDate}
        </Text>
      </Section>

      {/* ── Button ── */}
      {ticketUrl && (
        <Section style={{ textAlign: 'center', margin: '0 0 20px' }}>
          <EmailButton href={ticketUrl}>Ver boleta &rarr;</EmailButton>
        </Section>
      )}

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
          Podés ver y descargar tu boleta en cualquier momento desde el botón &ldquo;Ver
          boleta&rdquo;.
        </Text>
      </Section>
    </Layout>
  );
}
