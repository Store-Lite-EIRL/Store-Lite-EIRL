import { db } from '@/core/database/client';
import { businesses, products } from '@/core/database/schema';
import { OrderCompletedEmail } from '@/emails/OrderCompletedEmail';
import { OrderConfirmationEmail } from '@/emails/OrderConfirmationEmail';
import { render } from '@react-email/components';
import { eq } from 'drizzle-orm';
import { sendEmail } from './resend';

// ─── Helpers ───

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return new Date().toLocaleDateString('es-PE', { dateStyle: 'long' });
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTotal(amount: string | null | undefined): string {
  if (!amount) return '';
  const num = Number.parseFloat(amount);
  if (Number.isNaN(num)) return `S/ ${amount}`;
  return `S/ ${num.toFixed(2)}`;
}

// ─── Send order confirmation email ───

export async function sendOrderConfirmationEmail(
  payment: {
    buyerEmail?: string | null;
    id: string;
    trackingToken?: string | null;
    amount?: string | null;
    productId?: string | null;
    createdAt?: Date | string | null;
  },
  businessId: string,
): Promise<void> {
  if (!payment.buyerEmail) {
    console.log('[OrderEmails] No buyer email — skipping confirmation');
    return;
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { slug: true, name: true },
  });
  if (!business) return;

  // Look up product title
  let productTitle = 'tu compra';
  if (payment.productId) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, payment.productId),
      columns: { title: true },
    });
    if (product) productTitle = product.title;
  }

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${business.slug}/order/${payment.trackingToken || payment.id}`;
  const date = formatDate(payment.createdAt);
  const total = formatTotal(payment.amount);

  try {
    const html = await render(
      OrderConfirmationEmail({
        businessName: business.name,
        orderNumber: payment.id.slice(0, 8).toUpperCase(),
        date,
        productSummary: productTitle,
        total,
        trackingUrl,
      }),
    );

    await sendEmail({
      to: payment.buyerEmail,
      subject: `¡Compra confirmada en ${business.name}!`,
      html,
    });
  } catch (error) {
    console.error('[OrderEmails] Error sending confirmation email:', error);
  }
}

// ─── Send order completed email ───

export async function sendOrderCompletedEmail(
  payment: {
    buyerEmail?: string | null;
    id: string;
    trackingToken?: string | null;
    createdAt?: Date | string | null;
  },
  businessId: string,
): Promise<void> {
  if (!payment.buyerEmail) {
    console.log('[OrderEmails] No buyer email — skipping completion email');
    return;
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { slug: true, name: true },
  });
  if (!business) return;

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${business.slug}/order/${payment.trackingToken || payment.id}`;
  const date = formatDate(payment.createdAt);

  try {
    const html = await render(
      OrderCompletedEmail({
        businessName: business.name,
        orderNumber: payment.id.slice(0, 8).toUpperCase(),
        date,
        trackingUrl,
      }),
    );

    await sendEmail({
      to: payment.buyerEmail,
      subject: `¡Tu pedido en ${business.name} está completo!`,
      html,
    });
  } catch (error) {
    console.error('[OrderEmails] Error sending completion email:', error);
  }
}
