'use client';

/**
 * PlanTicketTemplate
 * Modern Glassmorphism Design for SaaS Plans.
 * High Fidelity / Professional Receipt Style.
 */

import { StoreLogo } from '@/shared/components/ui/data-display/StoreLogo';
import { Barcode } from '../../../shared/components/ui/data-display/receipt/Barcode';

const PLAN_LABELS: Record<string, string> = {
  basico: 'Básico',
  emprendedor: 'Emprendedor',
  business_pro: 'Business Pro',
  enterprise_ai: 'Enterprise AI',
};

interface PlanTicketTemplateProps {
  issuerRuc: string;
  issuerName: string;
  issuerAddress: string;
  issuerDistrict: string;
  issuerProvince: string;
  issuerDepartment: string;
  ticketNumber: string;
  ticketIssuedAt: Date;
  buyerEmail: string;
  buyerFullName?: string;
  buyerDocumentType?: string;
  buyerDocumentNumber?: string;
  planType: string;
  period: 'monthly' | 'annual';
  planStartDate: Date;
  planEndDate: Date;
  amountSubtotal: number;
  amountIgv: number;
  amountTotal: number;
  currency?: string;
  paymentMethod: string;
}

export function PlanTicketTemplate({
  issuerRuc,
  issuerName,
  issuerAddress,
  issuerDistrict,
  issuerProvince,
  issuerDepartment,
  ticketNumber,
  ticketIssuedAt,
  buyerEmail,
  buyerFullName,
  buyerDocumentType,
  buyerDocumentNumber,
  planType,
  period,
  planStartDate,
  planEndDate,
  amountSubtotal,
  amountIgv,
  amountTotal,
  currency = 'S/',
  paymentMethod,
}: PlanTicketTemplateProps) {
  const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

  const formatDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Lima',
    });
  };

  const formatFullDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Lima',
    });
  };

  const formatTime = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Lima',
    });
  };

  const planLabel = PLAN_LABELS[planType] || planType.toUpperCase();
  const periodLabel = period === 'monthly' ? 'Mensual' : 'Anual';

  // Design constants
  const primaryColor = '#0061A4'; // Store Lite Navy/Primary
  const bgColor = '#FFFFFF';
  const mutedText = '#49454F';
  const borderColor = '#D1D5DB';

  return (
    <div
      style={{
        fontFamily:
          "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: bgColor,
        width: '440px',
        padding: '0',
        color: '#111827',
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header Banner - Azul sólido */}
      <div
        style={{
          backgroundColor: primaryColor,
          padding: '20px 24px',
          textAlign: 'center',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <StoreLogo size={36} variant="white" iconOnly={false} />
      </div>

      {/* Brand & Issuer */}
      <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}
            >
              <StoreLogo size={42} variant="primary" iconOnly={true} />
              <h1
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '800',
                  color: primaryColor,
                  letterSpacing: '-0.5px',
                }}
              >
                Store Lite
              </h1>
            </div>
            <p style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: mutedText }}>
              {issuerName}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: mutedText }}>
              RUC: {issuerRuc}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                padding: '8px 14px',
                background: '#F3F4F6',
                borderRadius: '10px',
                display: 'inline-block',
                border: '1px solid #E5E7EB',
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  color: mutedText,
                  fontWeight: '700',
                  letterSpacing: '1px',
                }}
              >
                BOLETA
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  color: '#111827',
                }}
              >
                {ticketNumber}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Summary Info */}
      <div
        style={{
          padding: '18px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          background: '#F8FAFC',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: mutedText,
              textTransform: 'uppercase',
              marginBottom: '4px',
              letterSpacing: '0.5px',
            }}
          >
            Fecha de Emisión
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            {formatFullDate(ticketIssuedAt)}
          </div>
          <div style={{ fontSize: '12px', color: mutedText }}>{formatTime(ticketIssuedAt)} hrs</div>
        </div>
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: mutedText,
              textTransform: 'uppercase',
              marginBottom: '4px',
              letterSpacing: '0.5px',
            }}
          >
            Método de Pago
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            {paymentMethod === 'card'
              ? 'Tarjeta'
              : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
          </div>
        </div>
      </div>

      {/* Client / Buyer section */}
      <div style={{ padding: '18px 28px', borderBottom: `1px dashed ${borderColor}` }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: '700',
            color: mutedText,
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px',
          }}
        >
          Datos del Cliente
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
            {buyerFullName || buyerEmail}
          </div>
          <div style={{ fontSize: '12px', color: mutedText }}>
            {buyerDocumentType}: {buyerDocumentNumber || 'No registrado'}
          </div>
          {buyerEmail && <div style={{ fontSize: '12px', color: mutedText }}>{buyerEmail}</div>}
        </div>
      </div>

      {/* Subscription Details Table */}
      <div style={{ padding: '20px 28px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${borderColor}`, textAlign: 'left' }}>
              <th
                style={{
                  paddingBottom: '10px',
                  fontSize: '11px',
                  color: mutedText,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Descripción
              </th>
              <th
                style={{
                  paddingBottom: '10px',
                  fontSize: '11px',
                  color: mutedText,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: 'right',
                }}
              >
                Importe
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px 0' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                  Plan {planLabel}
                </div>
                <div style={{ fontSize: '12px', color: mutedText, marginTop: '2px' }}>
                  Facturación {periodLabel}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: mutedText,
                    marginTop: '6px',
                    background: '#F3F4F6',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    display: 'inline-block',
                  }}
                >
                  Vigente: {formatDate(planStartDate)} - {formatDate(planEndDate)}
                </div>
              </td>
              <td
                style={{
                  padding: '16px 0',
                  fontSize: '15px',
                  fontWeight: '700',
                  textAlign: 'right',
                  verticalAlign: 'top',
                  color: '#111827',
                }}
              >
                {fmt(amountSubtotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Financial Totals */}
      <div style={{ padding: '0 28px 24px' }}>
        <div
          style={{
            marginLeft: 'auto',
            width: '220px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: mutedText,
            }}
          >
            <span>Subtotal</span>
            <span style={{ fontWeight: '600', color: '#111827' }}>{fmt(amountSubtotal)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: mutedText,
            }}
          >
            <span>IGV (18%)</span>
            <span style={{ fontWeight: '600', color: '#111827' }}>{fmt(amountIgv)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: '800',
              marginTop: '6px',
              paddingTop: '10px',
              borderTop: `3px solid ${primaryColor}`,
              color: primaryColor,
            }}
          >
            <span>TOTAL A PAGAR</span>
            <span>{fmt(amountTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer & Barcode */}
      <div
        style={{
          padding: '24px 28px',
          background: '#F1F5F9',
          textAlign: 'center',
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <p style={{ margin: '0 0 18px 0', fontSize: '11px', color: mutedText, lineHeight: '1.5' }}>
          Este comprobante es una representación impresa de la Boleta de Venta Electrónica.
          <br />
          Puede verificar su autenticidad en.sunat.gob.pe
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '18px',
          }}
        >
          <Barcode
            value={ticketNumber}
            width={1.4}
            height={44}
            fontSize={10}
            background="transparent"
            displayValue={true}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: 0.4,
              color: '#000',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '1px',
            }}
          >
            <StoreLogo size={14} variant="primary" />
            <span>STORE LITE</span>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: mutedText, fontWeight: '500' }}>
          {issuerAddress} • {issuerDistrict}, {issuerProvince}, {issuerDepartment}
        </div>
      </div>
    </div>
  );
}
