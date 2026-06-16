'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { verificationOtps } from '@/core/database/schema';
import {
  CreateVerifiedBusinessSchema,
  RequestOtpSchema,
  VerifyIdentitySchema,
  VerifyOtpSchema,
} from '@/features/kyb/kybSchemas';
import { generateOTP, getRucInfo, getRucRepresentatives } from '@/lib/factiliza/client';
import { sendOtpWhatsApp } from '@/lib/twilio/client';
import { and, eq, gt, lte, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

// =====================================================
// HELPERS
// =====================================================

/**
 * Hashea un código OTP usando HMAC-SHA256.
 * NUNCA se almacena el código en texto plano en la DB.
 * Si alguien obtiene la DB, no puede reversar los OTPs
 * porque no tiene la clave HMAC secreta.
 */
function hashOtpCode(code: string): string {
  return crypto.createHmac('sha256', env.otpHashSecret).update(code).digest('hex');
}

/**
 * Limpia OTPs expirados de la DB.
 * Se llama antes de insertar un nuevo OTP para mantener
 * la tabla limpia sin necesidad de un cron job.
 */
async function cleanExpiredOtps(): Promise<void> {
  const result = await db
    .delete(verificationOtps)
    .where(lte(verificationOtps.expiresAt, new Date()))
    .returning({ id: verificationOtps.id });

  if (result.length > 0) {
    console.log(`[KYB] Cleaned up ${result.length} expired OTPs`);
  }
}

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

    // Debug: log what Factiliza returned
    console.log(
      `[KYB] Factiliza response for ${documentNumber}:`,
      JSON.stringify(rucInfo, null, 2),
    );

    // Check if we got valid data from Factiliza
    // API returns 'numero' field (not 'ruc')
    // NOTE: factilizaFetch now handles 404 and returns { success: false, data: null }
    if (!rucInfo || !rucInfo.numero) {
      // Check if it's a "not found" response
      if (rucInfo && rucInfo.success === false) {
        return {
          error: `El documento ${documentNumber} no está registrado en SUNAT. Verifique el número e intente nuevamente.`,
        };
      }
      return {
        error: `No se encontró información para el documento ${documentNumber}. Verifique que el RUC sea válido y esté activo en SUNAT.`,
      };
    }

    // Check if business is active (using correct API field names)
    if (rucInfo.estado !== 'ACTIVO' || rucInfo.condicion !== 'HABIDO') {
      return {
        error: `El RUC ${documentNumber} no está activo. Estado: ${rucInfo.estado}, Condición: ${rucInfo.condicion}`,
      };
    }

    const tipo = (rucInfo.tipo_contribuyente || '').toUpperCase();
    let personType: 'natural' | 'juridica';
    if (tipo.includes('PERSONA NATURAL')) {
      personType = 'natural';
    } else if (tipo.includes('SOCIEDAD') || tipo.includes('JURIDICA')) {
      personType = 'juridica';
    } else {
      // Fallback: RUCs starting with "20" are usually juridica
      personType = documentNumber.startsWith('20') ? 'juridica' : 'natural';
    }

    // Map API response fields to our internal structure (using SPANISH field names)
    // API uses: numero, nombre_o_razon_social, direccion, departamento, provincia, distrito
    if (personType === 'juridica') {
      // For PJ: Fetch representatives from the representatives endpoint
      console.log(`[KYB] Fetching representatives for PJ RUC: ${documentNumber}`);
      const representatives = await getRucRepresentatives(documentNumber);

      // Log what we got
      console.log(`[KYB] Representatives found:`, JSON.stringify(representatives, null, 2));

      // Check if we got any representatives
      if (!Array.isArray(representatives) || representatives.length === 0) {
        return {
          error: `No se encontraron representantes para el RUC ${documentNumber}. Verifique que el RUC sea válido.`,
        };
      }

      return {
        success: true,
        data: {
          personType,
          taxId: rucInfo.numero,
          razonSocial: rucInfo.nombre_o_razon_social,
          address: rucInfo.direccion,
          departamento: rucInfo.departamento,
          provincia: rucInfo.provincia,
          distrito: rucInfo.distrito,
          // PASS representatives for validation (as JSON string)
          representativesJson: JSON.stringify(representatives),
        },
      };
    } else {
      // For PN: Return legalRepName mapped from nombre_o_razon_social
      return {
        success: true,
        data: {
          personType,
          taxId: rucInfo.numero,
          legalRepName: rucInfo.nombre_o_razon_social,
          address: rucInfo.direccion,
          departamento: rucInfo.departamento,
          provincia: rucInfo.provincia,
          distrito: rucInfo.distrito,
        },
      };
    }
  } catch (error: unknown) {
    console.error(`[KYB] Error verifying ${formData.get('documentNumber')}:`, error);
    return { error: error instanceof Error ? error.message : 'Error al verificar el documento' };
  }
}

// =====================================================
// STEP 3: OTP REQUEST & VERIFICATION
// =====================================================

/**
 * Request OTP via WhatsApp
 * Generates a 6-digit code, hashes it, saves hash to DB, and sends via Twilio WhatsApp
 * Includes: rate limiting (max 3/5min), cleanup of expired OTPs, OTP hashing
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
    // Si el teléfono ya tiene un OTP con verified=true, está asociado
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

    // ── Cleanup de OTPs expirados ─────────────────────────────────
    await cleanExpiredOtps();

    // ── Generar y hashear OTP ─────────────────────────────────────
    const code = generateOTP();
    const codeHash = hashOtpCode(code);

    // Calculate expiration (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Save OTP hash to database (NUNCA el código en texto plano)
    await db.insert(verificationOtps).values({
      identifier,
      codeHash,
      type,
      expiresAt,
    });

    console.log(`[KYB] OTP hash saved to DB for ${identifier}, expires at ${expiresAt}`);

    // ── Enviar OTP via Twilio WhatsApp ─────────────────────────────
    if (type === 'phone') {
      // Format phone: combine country prefix + local number for international format
      const localNumber = identifier.trim();
      const phone = `${countryPrefix}${localNumber}`;

      console.log(`[KYB] Sending OTP via Twilio WhatsApp to ${phone}`);

      try {
        const result = await sendOtpWhatsApp(phone, code);

        if (result.status === 'failed' || result.status === 'undelivered') {
          console.error(`[KYB] Twilio failed to send OTP:`, result.status);
          return {
            error: `No se pudo enviar el código OTP. Estado: ${result.status}. Verifica que el número sea válido y tenga WhatsApp activo.`,
          };
        }

        console.log(`[KYB] OTP sent successfully via Twilio. SID: ${result.sid}`);
      } catch (twilioError: unknown) {
        console.error(`[KYB] Twilio error:`, twilioError);
        return {
          error: `Error al enviar OTP: ${twilioError instanceof Error ? twilioError.message : 'Verifica el número e intenta nuevamente'}`,
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
 * Verify OTP code
 * Checks if the code hash matches and hasn't expired
 * El código ingresado se hashea y se compara contra el hash almacenado
 */
export async function verifyOtpAction(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const parsed = VerifyOtpSchema.parse(rawData);
    const { identifier, code } = parsed;

    console.log(`[KYB] Verifying OTP for ${identifier}`);

    // Hashear el código ingresado para comparar contra el hash en DB
    const codeHash = hashOtpCode(code);

    // Find valid OTP in database by hash
    const otpRecord = await db
      .select()
      .from(verificationOtps)
      .where(
        and(
          eq(verificationOtps.identifier, identifier),
          eq(verificationOtps.codeHash, codeHash),
          eq(verificationOtps.verified, false),
          gt(verificationOtps.expiresAt, new Date()), // Not expired
        ),
      )
      .limit(1);

    if (otpRecord.length === 0) {
      console.log(`[KYB] Invalid or expired OTP for ${identifier}`);
      return { error: 'Código inválido o expirado. Solicita un nuevo código.' };
    }

    // Mark OTP as verified
    await db
      .update(verificationOtps)
      .set({ verified: true })
      .where(eq(verificationOtps.id, otpRecord[0].id));

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
