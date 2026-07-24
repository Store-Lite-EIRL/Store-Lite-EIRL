import { Heading, Section, Text } from '@react-email/components';
import { Layout } from './components/layout';

interface ComplaintConfirmationEmailProps {
  businessName: string;
  ticketNumber: string;
  date: string;
  consumerName: string;
  claimDescription: string;
  claimedAmount?: number;
  slaDeadline: string;
}

export function ComplaintConfirmationEmail({
  businessName,
  ticketNumber,
  date,
  consumerName,
  claimDescription,
  claimedAmount,
  slaDeadline,
}: ComplaintConfirmationEmailProps) {
  return (
    <Layout
      previewText={`Reclamo registrado — Código: ${ticketNumber}`}
      businessName={businessName}
    >
      <Heading
        style={{
          fontSize: '20px',
          color: '#18181b',
          margin: '0 0 4px',
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        Reclamo registrado
      </Heading>

      <Text
        style={{
          fontSize: '14px',
          color: '#52525b',
          margin: '0 0 24px',
          textAlign: 'center',
        }}
      >
        Hola, <strong>{consumerName}</strong>. Recibimos tu reclamo en{' '}
        <strong>{businessName}</strong>.
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
        {/* Ticket number + date header */}
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
              Código de reclamo
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

        <div style={{ borderTop: '1px dashed #d4d4d8', margin: '0 0 16px' }} />

        {/* Details */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td
                style={{
                  fontSize: '12px',
                  color: '#71717a',
                  padding: '0 0 8px',
                  fontWeight: '400',
                  width: '40%',
                  verticalAlign: 'top',
                }}
              >
                Descripción del reclamo
              </td>
              <td
                style={{
                  fontSize: '13px',
                  color: '#18181b',
                  padding: '0 0 8px',
                  fontWeight: '600',
                  textAlign: 'right',
                }}
              >
                {claimDescription.length > 120
                  ? `${claimDescription.slice(0, 120)}...`
                  : claimDescription}
              </td>
            </tr>
            {claimedAmount !== undefined && claimedAmount !== null && (
              <tr>
                <td
                  style={{
                    fontSize: '12px',
                    color: '#71717a',
                    padding: '0 0 8px',
                    fontWeight: '400',
                    verticalAlign: 'top',
                  }}
                >
                  Monto reclamado
                </td>
                <td
                  style={{
                    fontSize: '13px',
                    color: '#18181b',
                    padding: '0 0 8px',
                    fontWeight: '600',
                    textAlign: 'right',
                  }}
                >
                  S/ {claimedAmount.toFixed(2)}
                </td>
              </tr>
            )}
            <tr>
              <td
                style={{
                  fontSize: '12px',
                  color: '#71717a',
                  padding: '0 0 8px',
                  fontWeight: '400',
                  verticalAlign: 'top',
                }}
              >
                Fecha límite de respuesta
              </td>
              <td
                style={{
                  fontSize: '13px',
                  color: '#dc2626',
                  padding: '0 0 8px',
                  fontWeight: '700',
                  textAlign: 'right',
                }}
              >
                {slaDeadline}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* ── SLA Info ── */}
      <Section
        style={{
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          padding: '12px 16px',
          textAlign: 'center',
          margin: '0 0 20px',
        }}
      >
        <Text
          style={{
            fontSize: '13px',
            color: '#991b1b',
            margin: '0',
          }}
        >
          Tenés que recibir respuesta dentro de los <strong>15 días hábiles</strong> siguientes a la
          fecha de registro. Si no recibís respuesta, podés escalar al INDECOPI.
        </Text>
      </Section>

      {/* ── Disclaimer ── */}
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
            fontSize: '12px',
            color: '#71717a',
            margin: '0',
          }}
        >
          Guardá este código para hacer seguimiento de tu reclamo. La empresa tiene la obligación de
          resolverlo dentro del plazo legal establecido.
        </Text>
      </Section>
    </Layout>
  );
}
