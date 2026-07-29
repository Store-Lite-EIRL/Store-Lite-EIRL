'use server';

import { db } from '@/core/database/client';
import { verificationOtps } from '@/core/database/schema';
import {
  CreateVerifiedBusinessSchema,
  RequestOtpSchema,
  VerifyIdentitySchema,
  VerifyOtpSchema,
} from '@/features/business/actions/kybSchemas';
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

    console.log(`[KYB] Verifying document: ${documentNumber}`);

    const rucInfo = await getRucInfo(documentNumber);

    // Debug: log what the API returned
    console.log(`[KYB] API response for ${documentNumber}:`, JSON.stringify(rucInfo, null, 2));

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
      console.log(`[KYB] Fetching representatives for PJ RUC: ${documentNumber}`);
      const representatives = await getRucRepresentatives(documentNumber);

      console.log(`[KYB] Representatives found:`, JSON.stringify(representatives, null, 2));

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

    console.log(`[KYB] Requesting OTP for ${identifier} via ${type}`);

    // ── Rate limiting ──────────────────────────────────────────────
    const rateCheck = await checkOtpRateLimit(identifier);
    if (!rateCheck.allowed) {
      console.warn(`[KYB] Rate limit hit for ${identifier}`);
      return {
        error: `Demasiadas solicitudes. Intenta de nuevo en ${rateCheck.retryAfterSeconds} segundos.`,
      };
    }

    // ── Anti-fraude: número ya registrado? ─────────────────────────
    // Si el teléfono ya tiene un OTP verificado, está asociado
    // a otro negocio. Bloqueamos para evitar re-uso del mismo número.
    const existingVerified = await db
      .select({ id: verificationOtps.id })
      .from(verificationOtps)
      .where(and(eq(verificationOtps.identifier, identifier), eq(verificationOtps.verified, true)))
      .limit(1);

    if (existingVerified.length > 0) {
      console.log(`[KYB] Phone ${identifier} already registered, rejecting`);
      return {
        error: 'Este número ya está registrado en el sistema. Use un número diferente.',
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

    console.log(`[KYB] Tracking record created for ${identifier}`);

    // ── Enviar OTP via Twilio Verify ───────────────────────────────
    if (type === 'phone') {
      const phone = `${countryPrefix}${identifier.trim()}`;

      console.log(`[KYB] Sending OTP via Twilio Verify to ${phone}`);

      try {
        const result = await sendOtpViaVerify(phone);

        if (result.status === 'failed' || result.status === 'canceled') {
          console.error(`[KYB] Twilio Verify failed to send OTP:`, result.status);
          return {
            error: `No se pudo enviar el código. Verifica que el número sea válido y tenga WhatsApp activo.`,
          };
        }

        console.log(`[KYB] OTP sent via Twilio Verify. SID: ${result.sid}`);
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

    console.log(`[KYB] Verifying OTP for ${identifier}`);

    // Combine prefix + local number to get E.164 format for Verify
    const phone = `${countryPrefix}${identifier}`;

    // Verify the code via Twilio Verify
    const result = await checkOtpViaVerify(phone, code);

    if (!result.valid) {
      console.log(`[KYB] Invalid or expired OTP for ${identifier}`);
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

    console.log(`[KYB] OTP verified successfully for ${identifier}`);

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
    const parsed = CreateVerifiedBusinessSchema.parse(rawData);

    console.log(`[KYB] Creating verified business for owner: ${parsed.ownerId}`);

    // Business creation logic pending:
    // 1. Verify all KYB steps are completed
    // 2. Insert into businesses table
    // 3. Set verification_status to 'verified'
    // 4. Clean up used OTPs

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
