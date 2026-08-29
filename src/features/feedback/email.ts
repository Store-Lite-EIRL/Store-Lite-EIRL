// =====================================================
// FEEDBACK — Email Notifications
// =====================================================
// Sends email notifications for feedback events.
// Uses Resend via the shared sendEmail helper.
// =====================================================

import { sendEmail } from '@/lib/email/resend';

// ── Admin notification email (new ticket) ──

const ADMIN_EMAIL = 'devkittopsac@gmail.com';

interface BadgeStyle {
  background: string;
  color: string;
}

function requestTypeLabel(requestType: string): string {
  switch (requestType) {
    case 'support':
      return 'Soporte';
    case 'feedback':
      return 'Feedback';
    case 'complaint':
      return 'Queja';
    default:
      return requestType;
  }
}

function categoryLabel(category: string): string {
  switch (category) {
    case 'bug':
      return 'Bug / Error';
    case 'suggestion':
      return 'Sugerencia';
    case 'question':
      return 'Consulta';
    case 'other':
      return 'Otro';
    default:
      return category;
  }
}

function priorityLabel(priority: string): string {
  switch (priority) {
    case 'low':
      return 'Baja';
    case 'normal':
      return 'Normal';
    case 'high':
      return 'Alta';
    default:
      return priority;
  }
}

function typeBadgeStyle(requestType: string): BadgeStyle {
  switch (requestType) {
    case 'complaint':
      return { background: '#f8d7da', color: '#842029' };
    case 'support':
      return { background: '#cce5ff', color: '#084298' };
    default:
      return { background: '#d1e7dd', color: '#0f5132' };
  }
}

function priorityBadgeStyle(priority: string): BadgeStyle {
  switch (priority) {
    case 'high':
      return { background: '#fff3cd', color: '#856404' };
    case 'normal':
      return { background: '#d1e7dd', color: '#0f5132' };
    default:
      return { background: '#e9ecef', color: '#6c757d' };
  }
}

function contactBadges(contactEmail?: string, contactPhone?: string): string {
  let badges = '';
  if (contactEmail) {
    badges += `<span style="background: #d1e7dd; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #0f5132;">📧 ${contactEmail}</span>`;
  }
  if (contactPhone) {
    badges += `<span style="background: #cce5ff; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #084298; margin-left: 4px;">📱 ${contactPhone}</span>`;
  }
  return badges;
}

interface NotifyAdminNewTicketParams {
  ticketNumber: string;
  businessName: string;
  requestType: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  contactEmail?: string;
  contactPhone?: string;
}

export async function notifyAdminNewTicket(params: NotifyAdminNewTicketParams): Promise<void> {
  const {
    ticketNumber,
    businessName,
    requestType,
    category,
    subject,
    message,
    priority,
    contactEmail,
    contactPhone,
  } = params;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7b2ff7, #4a148c); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Nuevo Ticket — ${requestTypeLabel(requestType)}</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${ticketNumber}</p>
      </div>

      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-size: 13px; width: 120px;">Negocio</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${businessName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-size: 13px;">Tipo</td>
            <td style="padding: 8px 0; font-size: 14px;">
              <span style="background: ${typeBadgeStyle(requestType).background}; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: ${typeBadgeStyle(requestType).color};">
                ${requestTypeLabel(requestType)}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-size: 13px;">Categoría</td>
            <td style="padding: 8px 0; font-size: 14px;">
              <span style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${categoryLabel(category)}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-size: 13px;">Prioridad</td>
            <td style="padding: 8px 0; font-size: 14px;">
              <span style="background: ${priorityBadgeStyle(priority).background}; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: ${priorityBadgeStyle(priority).color};">
                ${priorityLabel(priority)}
              </span>
            </td>
          </tr>
          ${
            contactEmail || contactPhone
              ? `
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-size: 13px;">Contacto</td>
            <td style="padding: 8px 0; font-size: 14px;">
              ${contactBadges(contactEmail, contactPhone)}
            </td>
          </tr>
          `
              : ''
          }
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-size: 13px;">Asunto</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${subject}</td>
          </tr>
        </table>

        <div style="margin-top: 16px; padding: 16px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <p style="margin: 0 0 8px; color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Mensaje</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>

        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            ${contactEmail || contactPhone ? 'Contactá al usuario directamente por los datos indicados arriba.' : 'Respondé desde el panel de tu tienda en la sección de Ayuda.'}
          </p>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Feedback] ${ticketNumber} - ${subject}`,
    html,
  });
}

// ── User notification email (admin response) ──

interface NotifyUserResponseParams {
  ticketNumber: string;
  subject: string;
  adminMessage: string;
  userEmail: string;
}

export async function notifyUserResponse(params: NotifyUserResponseParams): Promise<void> {
  const { ticketNumber, subject, adminMessage, userEmail } = params;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a73e8, #0d47a1); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Respuesta a tu Feedback</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Ticket ${ticketNumber}</p>
      </div>

      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <p style="margin: 0 0 16px; font-size: 14px; color: #495057;">
          Hola, hemos respondido a tu feedback sobre:
        </p>

        <div style="padding: 12px 16px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 0; font-weight: 600; font-size: 14px;">${subject}</p>
        </div>

        <div style="padding: 16px; background: white; border-left: 4px solid #1a73e8; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${adminMessage}</p>
        </div>

        <p style="color: #6c757d; font-size: 12px; margin: 16px 0 0;">
          Puedes ver el historial completo en la sección de Feedback de tu panel.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Respuesta a tu ticket ${ticketNumber} - Store Lite`,
    html,
  });
}
