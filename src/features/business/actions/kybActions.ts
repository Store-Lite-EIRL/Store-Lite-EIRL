'use server';

import { db } from '@/core/database/client';
import { businesses, verificationOtps } from '@/core/database/schema';
import {
  CreateVerifiedBusinessSchema,
  RequestOtpSchema,
  VerifyIdentitySchema,
  VerifyOtpSchema,
} from '@/features/business/actions/kybSchemas';
import { captureEvent } from '@/lib/analytics/capture';
import { AnalyticsEvents } from '@/lib/analytics/taxonomy';
import { getRucInfo, getRucRepresentatives } from '@/lib/factiliza/client';
import { checkOtpViaVerify, sendOtpViaVerify } from '@/lib/twilio/client';
import { and, desc, eq, gt, sql } from 'drizzle-orm';

// =====================================================
// HELPERS
// =====================================================

/**
 * Rate limiting: máx 3 solicitudes OTP por identifier cada 5 minutos.
 * Esto evita que quemen saldo de Twilio spammeando números.
 */
async function checkOtpRateLimit(
  identifier: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const recentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(verificationOtps)
    .where(
      and(
        eq(verificationOtps.identifier, identifier),
        gt(verificationOtps.createdAt, fiveMinutesAgo),
      ),
    )
    .then((rows) => Number(rows[0]?.count ?? 0));

  if (recentCount >= 3) {
    // Find when the oldest of the 3 OTPs was created to suggest retry time
    const oldest = await db
      .select({ createdAt: verificationOtps.createdAt })
      .from(verificationOtps)
      .where(
        and(
          eq(verificationOtps.identifier, identifier),
          gt(verificationOtps.createdAt, fiveMinutesAgo),
        ),
      )
      .orderBy(verificationOtps.createdAt)
      .limit(1);

    const retryAfter = oldest[0]?.createdAt
      ? Math.ceil((fiveMinutesAgo.getTime() - oldest[0].createdAt.getTime() + 5 * 60 * 1000) / 1000)
      : 300;

    return { allowed: false, retryAfterSeconds: Math.max(retryAfter, 60) };
  }

  return { allowed: true };
}

export async function verifyIdentityAction(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const parsed = VerifyIdentitySchema.parse(rawData);
    const documentNumber = parsed.documentNumber;

    const rucInfo = await getRucInfo(documentNumber);

    // Check if we got valid data
    // JSON.pe returns field 'ruc' (not 'numero')
    if (!rucInfo || !rucInfo.ruc) {
      return {
        error: `No se encontró información para el documento ${documentNumber}. Verifique que el RUC sea válido y esté activo en SUNAT.`,
      };
    }

    // Check if business is active
    if (rucInfo.estado !== 'ACTIVO' || rucInfo.condicion !== 'HABIDO') {
      return {
        error: `El RUC ${documentNumber} no está activo. Estado: ${rucInfo.estado}, Condición: ${rucInfo.condicion}`,
      };
    }

    // Detect person type from RUC prefix:
    //   "10" = Persona Natural, "20" = Persona Jurídica
    // JSON.pe doesn't return tipo_contribuyente, so we use this heuristic
    const personType: 'natural' | 'juridica' = documentNumber.startsWith('20')
      ? 'juridica'
      : 'natural';

    if (personType === 'juridica') {
      // For PJ: Fetch legal representatives
      const representatives = await getRucRepresentatives(documentNumber);

      if (!Array.isArray(representatives) || representatives.length === 0) {
        return {
          error: `No se encontraron representantes para el RUC ${documentNumber}. Verifique que el RUC sea válido.`,
        };
      }

      return {
        success: true,
        data: {
          personType,
          taxId: rucInfo.ruc,
          razonSocial: rucInfo.nombre_o_razon_social,
          address: rucInfo.direccion,
          departamento: rucInfo.departamento,
          provincia: rucInfo.provincia,
          distrito: rucInfo.distrito,
          representativesJson: JSON.stringify(representatives),
        },
      };
    }

    // For PN: Return legalRepName from razon social
    return {
      success: true,
      data: {
        personType,
        taxId: rucInfo.ruc,
        legalRepName: rucInfo.nombre_o_razon_social,
        address: rucInfo.direccion,
        departamento: rucInfo.departamento,
        provincia: rucInfo.provincia,
        distrito: rucInfo.distrito,
      },
    };
  } catch (error: unknown) {
    console.error(`[KYB] Error verifying ${formData.get('documentNumber')}:`, error);
    return { error: error instanceof Error ? error.message : 'Error al verificar el documento' };
  }
}

// =====================================================
// STEP 3: OTP REQUEST & VERIFICATION
// =====================================================

/**
 * Request OTP via WhatsApp using Twilio Verify
 * Verify handles: OTP generation, template approval, expiration, delivery.
 * We keep: rate limiting (max 3/5min), anti-fraud tracking in our DB.
 */
export async function requestOtpAction(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const parsed = RequestOtpSchema.parse(rawData);
    const { identifier, type, countryPrefix } = parsed;

    // ── Rate limiting ──────────────────────────────────────────────
    const rateCheck = await checkOtpRateLimit(identifier);
    if (!rateCheck.allowed) {
      console.warn(`[KYB] Rate limit hit for ${identifier}`);
      return {
        error: `Demasiadas solicitudes. Intenta de nuevo en ${rateCheck.retryAfterSeconds} segundos.`,
      };
    }

    // ── Anti-fraude: número ya registrado? ─────────────────────────
    // Validamos contra los negocios que ya están creados,
    // NO contra los OTPs (ya que un OTP verificado no garantiza que se completó el registro).
    const existingBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.whatsappNumber, identifier),
      columns: { id: true },
    });

    if (existingBusiness) {
      return {
        error: 'Este número ya está registrado en un negocio activo. Use un número diferente.',
      };
    }

    // ── Insert tracking record (for anti-fraud) ────────────────────
    // Verify handles the real OTP storage and expiration.
    // We store a placeholder row to track verified phones.
    const farFuture = new Date('2100-01-01T00:00:00Z');
    await db.insert(verificationOtps).values({
      identifier,
      codeHash: '',
      type,
      expiresAt: farFuture,
    });

    // ── Enviar OTP via Twilio Verify ───────────────────────────────
    if (type === 'phone') {
      const phone = `${countryPrefix}${identifier.trim()}`;

      try {
        const result = await sendOtpViaVerify(phone);

        if (result.status === 'failed' || result.status === 'canceled') {
          console.error(`[KYB] Twilio Verify failed to send OTP:`, result.status);
          return {
            error: `No se pudo enviar el código. Verifica que el número sea válido y tenga WhatsApp activo.`,
          };
        }
      } catch (verifyError: unknown) {
        console.error(`[KYB] Twilio Verify error:`, verifyError);
        return {
          error: `Error al enviar OTP: ${verifyError instanceof Error ? verifyError.message : 'Verifica el número e intenta nuevamente'}`,
        };
      }
    } else {
      return { error: 'Email OTP not implemented yet' };
    }

    return { success: true, message: 'Código OTP enviado via WhatsApp' };
  } catch (error: unknown) {
    console.error(`[KYB] Error requesting OTP:`, error);
    return { error: error instanceof Error ? error.message : 'Error al solicitar código OTP' };
  }
}

/**
 * Verify OTP code using Twilio Verify
 * Verify checks the code, handles expiration, and returns approved/denied.
 * On success we mark the phone as verified in our DB (for anti-fraud).
 */
export async function verifyOtpAction(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const parsed = VerifyOtpSchema.parse(rawData);
    const { identifier, code, countryPrefix } = parsed;

    // Combine prefix + local number to get E.164 format for Verify
    const phone = `${countryPrefix}${identifier}`;

    // Verify the code via Twilio Verify
    const result = await checkOtpViaVerify(phone, code);

    if (!result.valid) {
      return { error: 'Código inválido o expirado. Solicita un nuevo código.' };
    }

    // Mark the most recent pending OTP record as verified (for anti-fraud tracking)
    const otpRecord = await db
      .select({ id: verificationOtps.id })
      .from(verificationOtps)
      .where(and(eq(verificationOtps.identifier, identifier), eq(verificationOtps.verified, false)))
      .orderBy(desc(verificationOtps.createdAt))
      .limit(1);

    if (otpRecord.length > 0) {
      await db
        .update(verificationOtps)
        .set({ verified: true })
        .where(eq(verificationOtps.id, otpRecord[0].id));
    }

    return { success: true, message: 'Código verificado exitosamente' };
  } catch (error: unknown) {
    console.error(`[KYB] Error verifying OTP:`, error);
    return { error: error instanceof Error ? error.message : 'Error al verificar código' };
  }
}

// =====================================================
// STEP 4: CREATE VERIFIED BUSINESS
// =====================================================

/**
 * Create business after all KYB steps are completed
 * This should only be called after identity, representative, and OTP verification
 */
export async function createVerifiedBusinessAction(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const parsed = CreateVerifiedBusinessSchema.parse(rawData);

    // Business creation logic pending:
    // 1. Verify all KYB steps are completed
    // 2. Insert into businesses table
    // 3. Set verification_status to 'verified'
    // 4. Clean up used OTPs

    // Fire-and-forget: capture business creation event
    captureEvent(AnalyticsEvents.BUSINESS_CREATED).catch(() => {});

    return {
      success: true,
      message: 'Negocio creado exitosamente',
      data: { businessId: 'temp-id' }, // Replace with actual ID
    };
  } catch (error: unknown) {
    console.error(`[KYB] Error creating business:`, error);
    return { error: error instanceof Error ? error.message : 'Error al crear el negocio' };
  }
}
