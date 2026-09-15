// =====================================================
// LEGAL NOTIFICATION TEMPLATES
// =====================================================
// DS 011-2011-PCM compliant written notification templates
// for auto-deactivation and appeal workflow.
// =====================================================

interface BusinessInfo {
  id: string;
  name: string;
  slug: string;
  legalName: string;
  taxId: string;
  email: string;
  address: string;
}

function formatDate(date: Date): string {
  const d = date.toLocaleDateString('en-GB'); // dd/MM/yyyy
  const t = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${d} a las ${t}`;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-GB'); // dd/MM/yyyy
}

const PLATFORM_NAME = 'Store Lite';
const PLATFORM_EMAIL = 'soporte@storelite.com';
const PLATFORM_URL = 'https://storelite.pe';

function getBaseStyles(): string {
  return `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1d1d1f; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 24px; }
      .header { background: #1a1a2e; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #ffffff; padding: 24px; border: 1px solid #e0e0e0; border-top: none; }
      .footer { background: #f5f5f5; padding: 16px 24px; text-align: center; font-size: 12px; color: #666; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
      .alert-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .error-box { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .success-box { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .info-box { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .complaint-list { background: #f8f9fa; border-radius: 8px; padding: 12px; margin: 12px 0; font-family: monospace; font-size: 14px; }
      .button { display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
      .legal-ref { font-size: 11px; color: #888; font-style: italic; }
    </style>
  `;
}

function getHeader(title: string): string {
  return `
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
      <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">${title}</p>
    </div>
  `;
}

function getFooter(): string {
  return `
    <div class="footer">
      <p style="margin: 0 0 8px;"><strong>${PLATFORM_NAME}</strong> - Plataforma de tiendas virtuales</p>
      <p style="margin: 0;">${PLATFORM_EMAIL} | ${PLATFORM_URL}</p>
      <p class="legal-ref" style="margin-top: 12px;">Este correo se envía en cumplimiento del DS 011-2011-PCM (Libro de Reclamaciones Virtual).</p>
    </div>
  `;
}

export interface DeactivationNoticeParams {
  business: BusinessInfo;
  reason: 'verified_complaints' | 'incomplete_orders';
  complaintIds: string[];
  graceUntil: Date;
}

export function deactivationNotice(params: DeactivationNoticeParams): string {
  const { business, reason, complaintIds, graceUntil } = params;
  const reasonText =
    reason === 'verified_complaints'
      ? 'Denuncias verificadas'
      : 'Tasa de pedidos incompletos superior al 40%';
  const complaintListHtml = complaintIds.map((id) => `<div>• ${id}</div>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Desactivación - ${business.name}</title>
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    ${getHeader('Notificación de Desactivación de Cuenta')}
    <div class="content">
      <p>Estimado titular de <strong>${business.legalName}</strong> (RUC: ${business.taxId}):</p>
      <p><strong>Dirección registrada:</strong> ${business.address}<br>
      <strong>Correo de contacto:</strong> ${business.email}</p>

      <p>Por medio de la presente, le notificamos que su cuenta en <strong>${PLATFORM_NAME}</strong> ha sido <strong>desactivada automáticamente</strong> conforme a lo dispuesto en el <strong>DS 011-2011-PCM</strong> (Reglamento del Libro de Reclamaciones Virtual). Esta notificación se emite en relación con los reclamos recibidos a través del Libro de Reclamaciones.</p>

      <div class="alert-box">
        <strong>Motivo de la desactivación:</strong> ${reasonText}<br>
        <strong>Fecha de notificación:</strong> ${formatDate(new Date())}<br>
        <strong>Período de gracia hasta:</strong> ${formatDate(graceUntil)} (72 horas)
      </div>

      <h3>Detalle de las denuncias verificadas</h3>
      <div class="complaint-list">
        ${complaintListHtml}
      </div>

      <h3>Derechos del comerciante</h3>
      <p>De conformidad con el artículo 23 del DS 011-2011-PCM, usted tiene derecho a presentar una <strong>apelación</strong> dentro de los <strong>10 días hábiles</strong> contados a partir de la fecha de esta notificación.</p>

      <div class="info-box">
        <strong>Plazo para apelar:</strong> 10 días hábiles<br>
        <strong>Fecha límite estimada:</strong> ${formatDateShort(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))}
      </div>

      <p>Para presentar su apelación, ingrese a su panel de comerciante en <a href="${PLATFORM_URL}/${business.slug}/dashboard/penalties">${PLATFORM_URL}/${business.slug}/dashboard/penalties</a> y complete el formulario de apelación adjuntando la documentación que considere pertinente.</p>

      <p style="text-align: center; margin: 24px 0;">
        <a href="${PLATFORM_URL}/${business.slug}/dashboard/penalties" class="button">Presentar Apelación</a>
      </p>

      <p>Si no presenta apelación dentro del plazo indicado, la desactivación se confirmará automáticamente y su tienda virtual permanecerá inactiva.</p>

      <p>Para consultas, puede contactarnos a <a href="mailto:${PLATFORM_EMAIL}">${PLATFORM_EMAIL}</a>.</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>`;
}

export interface GracePeriodNoticeParams {
  business: BusinessInfo;
  graceUntil: Date;
  appealDeadline: Date;
}

export function gracePeriodNotice(params: GracePeriodNoticeParams): string {
  const { business, graceUntil, appealDeadline } = params;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio: Período de Gracia - ${business.name}</title>
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    ${getHeader('Recordatorio: Período de Gracia por Desactivación')}
    <div class="content">
      <p>Estimado titular de <strong>${business.legalName}</strong> (RUC: ${business.taxId}):</p>

      <p>Le recordamos que su cuenta se encuentra en <strong>período de gracia</strong> tras la notificación de desactivación automática.</p>

      <div class="alert-box">
        <strong>El período de gracia finaliza:</strong> ${formatDate(graceUntil)}<br>
        <strong>Tiempo restante:</strong> 72 horas desde la notificación original
      </div>

      <p>Durante este período, usted puede:</p>
      <ul>
        <li>Presentar una <strong>apelación formal</strong> con sus argumentos y evidencia</li>
        <li>Subir documentos que respalden su posición</li>
        <li>Solicitar una revisión de las denuncias que motivaron la desactivación</li>
      </ul>

      <div class="info-box">
        <strong>Plazo para apelar:</strong> ${formatDateShort(appealDeadline)} (10 días hábiles desde la notificación original)
      </div>

      <p style="text-align: center; margin: 24px 0;">
        <a href="${PLATFORM_URL}/${business.slug}/dashboard/penalties" class="button">Presentar Apelación Ahora</a>
      </p>

      <p><strong>Importante:</strong> Si no presenta apelación antes de que finalice el período de gracia, la desactivación se confirmará automáticamente.</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>`;
}

export interface AppealReceivedNoticeParams {
  business: BusinessInfo;
  appealId: string;
  slaDeadline: Date;
}

export function appealReceivedNotice(params: AppealReceivedNoticeParams): string {
  const { business, appealId, slaDeadline } = params;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apelación Recibida - ${business.name}</title>
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    ${getHeader('Confirmación de Recepción de Apelación')}
    <div class="content">
      <p>Estimado titular de <strong>${business.legalName}</strong> (RUC: ${business.taxId}):</p>

      <p>Su <strong>apelación recibida</strong> contra la desactivación automática de su cuenta ha sido registrada correctamente.</p>

      <div class="info-box">
        <strong>ID de Apelación:</strong> ${appealId}<br>
        <strong>Fecha de recepción:</strong> ${formatDate(new Date())}<br>
        <strong>Fecha límite de respuesta (SLA):</strong> ${formatDate(slaDeadline)} (10 días hábiles)
      </div>

      <p>Nuestro equipo de revisión evaluará su apelación y la documentación presentada. Recibirá una notificación con la decisión antes de la fecha límite indicada.</p>

      <p>Mientras se resuelve su apelación, su cuenta permanecerá en estado de <strong>apelación pendiente</strong>.</p>

      <p>Para consultas sobre el estado de su apelación, puede contactarnos a <a href="mailto:${PLATFORM_EMAIL}">${PLATFORM_EMAIL}</a> indicando el ID: <strong>${appealId}</strong>.</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>`;
}

export interface AppealDecisionNoticeParams {
  business: BusinessInfo;
  decision: 'approved' | 'rejected';
  adminNotes: string;
  reactivatedAt?: Date;
}

export function appealDecisionNotice(params: AppealDecisionNoticeParams): string {
  const { business, decision, adminNotes, reactivatedAt } = params;
  const isApproved = decision === 'approved';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isApproved ? 'Apelación Aprobada' : 'Apelación Rechazada'} - ${business.name}</title>
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    ${getHeader(isApproved ? 'Apelación Aprobada - Cuenta Reactivada' : 'Apelación Rechazada - Desactivación Confirmada')}
    <div class="content">
      <p>Estimado titular de <strong>${business.legalName}</strong> (RUC: ${business.taxId}):</p>

      ${
        isApproved
          ? `<div class="success-box">
          <strong>DECISIÓN: APROBADA</strong><br>
          Su apelación ha sido <strong>fundada</strong>. Su cuenta ha sido <strong>reactivada</strong> el ${reactivatedAt ? formatDate(reactivatedAt) : 'la fecha de esta notificación'}.
        </div>
        <p>Su tienda virtual ya está nuevamente accesible para sus clientes.</p>`
          : `<div class="error-box">
          <strong>DECISIÓN: RECHAZADA</strong><br>
          Su apelación ha sido declarada <strong>no fundada</strong>. La <strong>desactivación se mantiene</strong>.
        </div>
        <p>Su tienda virtual permanecerá inactiva.</p>`
      }

      <h3>Fundamentos de la decisión</h3>
      <div class="complaint-list">
        ${adminNotes}
      </div>

      ${
        isApproved
          ? `<p>Si tiene alguna consulta, no dude en contactarnos a <a href="mailto:${PLATFORM_EMAIL}">${PLATFORM_EMAIL}</a>.</p>`
          : `<p>Esta decisión es definitiva en vía administrativa. Para consultas, contacte a <a href="mailto:${PLATFORM_EMAIL}">${PLATFORM_EMAIL}</a>.</p>`
      }
    </div>
    ${getFooter()}
  </div>
</body>
</html>`;
}
