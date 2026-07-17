'use server';

// =====================================================
// LEGAL — Server Actions
// =====================================================

import { db } from '@/core/database/client';
import { businesses, businessSettings, complaintBookRecords } from '@/core/database/schema';
import { requireAccessOnId } from '@/features/storage/actions/authz';
import type { ActionState } from '@/types/actions';
import { and, desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// Zod Schemas
// =====================================================

const legalContentField = z
  .string()
  .max(10000, 'El texto no puede exceder los 10,000 caracteres')
  .nullable()
  .optional()
  .transform((v) => (v === '' ? null : v));

export const legalContentSchema = z.object({
  termsContent: legalContentField,
  returnsContent: legalContentField,
});

export const complaintFormSchema = z.object({
  consumerLastName: z.string().min(1, 'El apellido es obligatorio').max(100),
  consumerFirstName: z.string().min(1, 'El nombre es obligatorio').max(100),
  consumerDocumentType: z.enum(['dni', 'ce'], { message: 'Tipo de documento inválido' }),
  consumerDocumentId: z.string().min(1, 'El número de documento es obligatorio').max(20),
  consumerAddress: z.string().min(1, 'La dirección es obligatoria').max(500),
  consumerPhone: z.string().min(1, 'El teléfono es obligatorio').max(20),
  consumerEmail: z.string().email('Correo electrónico inválido').max(200),
  minorAge: z.boolean().default(false),
  guardianName: z.string().max(200).nullable().optional(),
  contractDescription: z
    .string()
    .min(1, 'La descripción del bien o servicio es obligatoria')
    .max(1000),
  claimedAmount: z
    .number()
    .positive('El monto debe ser positivo')
    .max(999999999)
    .nullable()
    .optional(),
  claimDescription: z
    .string()
    .min(20, 'La descripción debe tener entre 20 y 2,000 caracteres')
    .max(2000, 'La descripción debe tener entre 20 y 2,000 caracteres'),
  consumerRequest: z.string().min(1, 'El pedido del consumidor es obligatorio').max(2000),
});

const complaintResponseSchema = z.object({
  response: z
    .string()
    .min(1, 'La respuesta no puede estar vacía')
    .max(5000, 'La respuesta no puede exceder 5,000 caracteres'),
});

// =====================================================
// T4: saveLegalContent
// =====================================================

export async function saveLegalContent(
  businessId: string,
  slug: string,
  data: { termsContent?: string | null; returnsContent?: string | null },
): Promise<ActionState> {
  try {
    await requireAccessOnId(businessId, 'legal.edit');

    const parsed = legalContentSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message;
      return { success: false, error: firstError || 'Datos no válidos' };
    }

    const existingSettings = await db.query.businessSettings.findFirst({
      where: eq(businessSettings.businessId, businessId),
      columns: { id: true, preferences: true },
    });

    const currentPreferences = (existingSettings?.preferences ?? {}) as Record<string, unknown>;
    const nextPreferences = {
      ...currentPreferences,
      ...(parsed.data.termsContent !== undefined && {
        termsContent: parsed.data.termsContent,
      }),
      ...(parsed.data.returnsContent !== undefined && {
        returnsContent: parsed.data.returnsContent,
      }),
    };

    if (existingSettings) {
      await db
        .update(businessSettings)
        .set({ preferences: nextPreferences, updatedAt: new Date() })
        .where(eq(businessSettings.businessId, businessId));
    } else {
      await db.insert(businessSettings).values({
        businessId,
        themeMode: 'light',
        contrastLevel: 'standard',
        preferences: nextPreferences,
      });
    }

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    revalidatePath(`/${slug}/terminos`);
    revalidatePath(`/${slug}/devoluciones`);
    revalidatePath('/', 'layout');

    return { success: true, message: 'Contenido legal guardado correctamente.' };
  } catch (error) {
    console.error('[legal] Error saving legal content:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return { success: false, error: 'No tenés permisos para editar la información legal.' };
    }
    return { success: false, error: 'Error al guardar el contenido legal.' };
  }
}

// =====================================================
// Business day calculation helper
// =====================================================

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return result;
}

// =====================================================
// T5: submitComplaint
// =====================================================

export async function submitComplaint(
  slug: string,
  formData: z.infer<typeof complaintFormSchema>,
): Promise<ActionState & { ticketNumber?: string; emailFailed?: boolean }> {
  try {
    const parsed = complaintFormSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return {
        success: false,
        error: 'Corregí los errores en el formulario.',
      };
    }

    const data = parsed.data;

    // Resolve business from slug
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
      columns: { id: true, name: true },
    });

    if (!business) {
      return { success: false, error: 'Tienda no encontrada.' };
    }

    const businessId = business.id;
    const businessName = business.name ?? 'Tienda';

    // Generate ticket number: LR-{year}-{businessIdShort}-{seq}
    const year = new Date().getFullYear();
    const businessIdShort = businessId.replace(/-/g, '').slice(0, 8);

    const lastRecord = await db
      .select({ maxSeq: sql<string>`COALESCE(MAX(seq), '0')` })
      .from(complaintBookRecords)
      .where(
        and(
          eq(complaintBookRecords.businessId, businessId),
          sql`EXTRACT(YEAR FROM ${complaintBookRecords.createdAt}) = ${year}`,
        ),
      )
      .limit(1)
      .then((rows) => rows[0]?.maxSeq ?? '0');

    const nextSeq = String(Number(lastRecord) + 1).padStart(4, '0');
    const ticketNumber = `LR-${year}-${businessIdShort}-${nextSeq}`;

    // Calculate SLA deadline (15 business days)
    const slaDeadline = addBusinessDays(new Date(), 15);

    // Insert complaint record
    const [record] = await db
      .insert(complaintBookRecords)
      .values({
        businessId,
        ticketNumber,
        consumerLastName: data.consumerLastName,
        consumerFirstName: data.consumerFirstName,
        consumerDocType: data.consumerDocumentType,
        consumerDocId: data.consumerDocumentId,
        consumerAddress: data.consumerAddress,
        consumerPhone: data.consumerPhone,
        consumerEmail: data.consumerEmail,
        minorAge: data.minorAge,
        guardianName: data.guardianName ?? null,
        contractDescription: data.contractDescription,
        claimedAmount: data.claimedAmount ? String(data.claimedAmount) : null,
        claimDescription: data.claimDescription,
        consumerRequest: data.consumerRequest,
        slaDeadline,
        status: 'pending',
      })
      .returning();

    // Attempt to send confirmation email (non-blocking)
    let emailFailed = false;
    try {
      const { render } = await import('@react-email/components');
      const { ComplaintConfirmationEmail } = await import('@/emails/ComplaintConfirmationEmail');
      const { sendEmail } = await import('@/lib/email/resend');

      const emailHtml = await render(
        ComplaintConfirmationEmail({
          businessName: `Tienda`,
          ticketNumber,
          date: new Date().toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          consumerName: `${data.consumerFirstName} ${data.consumerLastName}`,
          claimDescription: data.claimDescription,
          claimedAmount: data.claimedAmount ?? undefined,
          slaDeadline: slaDeadline.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        }),
      );

      await sendEmail({
        to: data.consumerEmail,
        subject: `Libro de Reclamaciones — Código: ${ticketNumber}`,
        html: emailHtml,
      });

      // Mark email as sent
      await db
        .update(complaintBookRecords)
        .set({ emailSentAt: new Date() })
        .where(eq(complaintBookRecords.id, record.id));
    } catch (emailError) {
      console.warn('[legal] Failed to send complaint confirmation email:', emailError);
      emailFailed = true;
    }

    return {
      success: true,
      ticketNumber,
      emailFailed,
    };
  } catch (error) {
    console.error('[legal] Error submitting complaint:', error);
    return { success: false, error: 'Error al registrar el reclamo. Intentalo de nuevo.' };
  }
}

// =====================================================
// T6: respondToComplaint
// =====================================================

// =====================================================
// getComplaints — fetch complaints for admin panel
// =====================================================

export interface ComplaintRecord {
  id: string;
  ticketNumber: string;
  consumerFirstName: string;
  consumerLastName: string;
  consumerEmail: string;
  claimDescription: string;
  status: 'pending' | 'acknowledged' | 'responded';
  createdAt: string;
  slaDeadline: string;
}

export async function getComplaints(
  businessId: string,
): Promise<{ success: true; complaints: ComplaintRecord[] } | { success: false; error: string }> {
  try {
    await requireAccessOnId(businessId, 'legal.edit');

    const records = await db
      .select({
        id: complaintBookRecords.id,
        ticketNumber: complaintBookRecords.ticketNumber,
        consumerFirstName: complaintBookRecords.consumerFirstName,
        consumerLastName: complaintBookRecords.consumerLastName,
        consumerEmail: complaintBookRecords.consumerEmail,
        claimDescription: complaintBookRecords.claimDescription,
        status: complaintBookRecords.status,
        createdAt: complaintBookRecords.createdAt,
        slaDeadline: complaintBookRecords.slaDeadline,
      })
      .from(complaintBookRecords)
      .where(
        and(
          eq(complaintBookRecords.businessId, businessId),
          sql`${complaintBookRecords.deletedAt} IS NULL`,
        ),
      )
      .orderBy(desc(complaintBookRecords.createdAt))
      .limit(50);

    return {
      success: true,
      complaints: records.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        slaDeadline: r.slaDeadline.toISOString(),
      })),
    };
  } catch (error) {
    console.error('[legal] Error fetching complaints:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return { success: false, error: 'No tenés permisos para ver reclamos.' };
    }
    return { success: false, error: 'Error al cargar los reclamos.' };
  }
}

export async function respondToComplaint(
  businessId: string,
  complaintId: string,
  response: string,
): Promise<ActionState> {
  try {
    await requireAccessOnId(businessId, 'legal.edit');

    const parsed = complaintResponseSchema.safeParse({ response });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Respuesta no válida.',
      };
    }

    // Fetch the complaint to verify it belongs to this business and is respondable
    const complaint = await db.query.complaintBookRecords.findFirst({
      where: and(
        eq(complaintBookRecords.id, complaintId),
        eq(complaintBookRecords.businessId, businessId),
      ),
      columns: { id: true, status: true },
    });

    if (!complaint) {
      return { success: false, error: 'Reclamo no encontrado.' };
    }

    if (complaint.status === 'responded') {
      return { success: false, error: 'Este reclamo ya fue respondido.' };
    }

    await db
      .update(complaintBookRecords)
      .set({
        status: 'responded',
        adminResponse: parsed.data.response,
        adminRespondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(complaintBookRecords.id, complaintId));

    revalidatePath('/', 'layout');

    return { success: true, message: 'Respuesta registrada correctamente.' };
  } catch (error) {
    console.error('[legal] Error responding to complaint:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return { success: false, error: 'No tenés permisos para responder reclamos.' };
    }
    return { success: false, error: 'Error al registrar la respuesta.' };
  }
}
