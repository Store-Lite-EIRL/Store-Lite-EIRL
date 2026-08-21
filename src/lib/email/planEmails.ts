import { db } from '@/core/database/client';
import { businesses, formatTicketNumber, type PlanPayment } from '@/core/database/schema';
import { PlanPurchaseConfirmationEmail } from '@/emails/PlanPurchaseConfirmationEmail';
import { PLAN_PRICES } from '@/shared/billing/planPrices';
import { render } from '@react-email/components';
import { eq } from 'drizzle-orm';
import { sendEmail } from './resend';

// ─── Helpers ───

function formatAmount(amount: string | null | undefined): string {
  if (!amount) return '';
  const num = Number.parseFloat(amount);
  if (Number.isNaN(num)) return `S/ ${amount}`;
  return `S/ ${num.toFixed(2)}`;
}

function formatPlanEndDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Lima',
  });
}

// ─── Send plan purchase confirmation email ───

export async function sendPlanPurchaseConfirmationEmail(
  planPayment: PlanPayment,
  businessId: string,
): Promise<void> {
  if (!planPayment.buyerEmail) {
    return;
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { slug: true, name: true },
  });
  if (!business) return;

  const planName = PLAN_PRICES[planPayment.planType]?.label ?? planPayment.planType;

  try {
    const html = await render(
      PlanPurchaseConfirmationEmail({
        businessName: business.name,
        planName,
        ticketNumber: formatTicketNumber(planPayment.ticketSeries, planPayment.ticketCorrelative),
        amountTotal: formatAmount(planPayment.amountTotal),
        planEndDate: formatPlanEndDate(planPayment.planEndDate),
        ticketUrl: planPayment.ticketUrl || undefined,
        customerFullName: planPayment.buyerFullName || undefined,
        customerDocumentType: planPayment.buyerDocumentType || undefined,
        customerDocumentNumber: planPayment.buyerDocumentNumber || undefined,
      }),
    );

    await sendEmail({
      to: planPayment.buyerEmail,
      subject: 'Tu boleta de compra de plan Store Lite',
      html,
    });
  } catch (error) {
    console.error('[PlanEmails] Error sending plan purchase confirmation email:', error);
  }
}
