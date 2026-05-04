// =====================================================
// KYB SERVER ACTIONS
// =====================================================
// Description: Server Actions for KYB Verification Flow
// Usage: Import in forms/components using 'use server'
// =====================================================

'use server';

import { env } from '@/config/env';
import { db } from '@/core/database/client';
import { businesses, verificationOtps } from '@/core/database/schema';
import {
  CreateVerifiedBusinessSchema,
  RequestOtpSchema,
  VerifyIdentitySchema,
  VerifyOtpSchema,
  VerifyRepresentativeSchema,
} from '@/features/kyb/kyb-schemas';
import type {
  FactilizaDniInfo,
  FactilizaRepresentative,
  FactilizaRucInfo,
} from '@/lib/factiliza/client';
import {
  generateOTP,
  getDniInfo,
  getRucInfo,
  getRucRepresentatives,
  sendWhatsAppOTP,
} from '@/lib/factiliza/client';
import { createClient } from '@/lib/supabase/server';
import { and, eq, gt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// =====================================================
// STEP 1: Verify Identity (RUC or DNI)
// =====================================================

export async function verifyIdentityAction(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const { personType, documentNumber } = VerifyIdentitySchema.parse(raw);

    let rucInfo: FactilizaRucInfo | null = null;
    let dniInfo: FactilizaDniInfo | null = null;

    if (personType === 'juridica') {
      // Validate RUC via Factiliza
      rucInfo = await getRucInfo(documentNumber);

      if (rucInfo.estado !== 'ACTIVO' || rucInfo.condicion !== 'HABIDO') {
        return {
          error: `El RUC ${documentNumber} no está ACTIVO o HABIDO. Estado: ${rucInfo.estado}, Condición: ${rucInfo.condicion}`,
        };
      }

      return {
        success: true,
        data: {
          personType,
          taxId: rucInfo.ruc,
          razonSocial: rucInfo.razonSocial,
          address: rucInfo.direccion,
          department: rucInfo.departamento,
          province: rucInfo.provincia,
          district: rucInfo.distrito,
        },
      };
    } else {
      // Validate DNI via Factiliza (Natural)
      dniInfo = await getDniInfo(documentNumber);

      return {
        success: true,
        data: {
          personType,
          taxId: dniInfo.dni,
          legalRepName: dniInfo.nombreCompleto,
        },
      };
    }
  } catch (error: any) {
    console.error('[KYB Step1] Error:', error);
    return { error: error.message || 'Error al verificar identidad' };
  }
}

// =====================================================
// STEP 2: Verify Representative (Juridica only)
// =====================================================

export async function verifyRepresentativeAction(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const { dni, fullName, businessName, address, department, province, district } =
      VerifyRepresentativeSchema.parse(raw);

    // 1. Get representative info from DNI
    const repInfo = await getDniInfo(dni);
    const dniFullName = repInfo.nombreCompleto.toLowerCase();

    // 2. If Juridica, validate against RUC representatives
    // We need the RUC here. Assuming it comes from previous step context or formData
    const ruc = formData.get('taxId') as string;

    if (ruc && ruc.length === 11) {
      const representatives = await getRucRepresentatives(ruc);
      const match = representatives.representantes.some(
        (rep: FactilizaRepresentative) =>
          rep.numeroDocumento === dni &&
          rep.nombres.toLowerCase().includes(repInfo.nombres.toLowerCase()), // Basic match
      );

      if (!match) {
        return { error: 'El DNI ingresado no coincide con los representantes legales del RUC.' };
      }
    }

    return {
      success: true,
      data: {
        legalRepName: repInfo.nombreCompleto,
        legalRepDni: dni,
        name: businessName || repInfo.nombreCompleto, // Default to person's name if no business name
        address,
        city: district ? `${department}-${province}-${district}` : undefined,
      },
    };
  } catch (error: any) {
    console.error('[KYB Step2] Error:', error);
    return { error: error.message || 'Error al verificar representante' };
  }
}

// =====================================================
// STEP 3: Request OTP (Send WhatsApp)
// =====================================================

export async function requestOtpAction(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const { identifier } = RequestOtpSchema.parse(raw);

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store in DB (verification_otps)
    await db.insert(verificationOtps).values({
      identifier,
      code,
      type: 'phone',
      expiresAt,
    });

    // Send via Factiliza WhatsApp
    if (env.factilizaWspInstance) {
      await sendWhatsAppOTP(identifier, code);
    } else {
      console.warn('[KYB] Factiliza WhatsApp not configured. OTP:', code);
    }

    return { success: true, message: 'Código enviado por WhatsApp' };
  } catch (error: any) {
    console.error('[KYB OTP Request] Error:', error);
    return { error: error.message || 'Error al enviar OTP' };
  }
}

// =====================================================
// STEP 3b: Verify OTP Code
// =====================================================

export async function verifyOtpAction(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const { identifier, code } = VerifyOtpSchema.parse(raw);

    // Find valid OTP in DB
    const otpRecord = await db.query.verificationOtps.findFirst({
      where: and(
        eq(verificationOtps.identifier, identifier),
        eq(verificationOtps.code, code),
        eq(verificationOtps.verified, false),
        gt(verificationOtps.expiresAt, new Date()), // Not expired
      ),
    });

    if (!otpRecord) {
      return { error: 'Código inválido o expirado' };
    }

    // Mark as verified
    await db
      .update(verificationOtps)
      .set({ verified: true })
      .where(eq(verificationOtps.id, otpRecord.id));

    return { success: true, message: 'Teléfono verificado correctamente' };
  } catch (error: any) {
    console.error('[KYB OTP Verify] Error:', error);
    return { error: error.message || 'Error al verificar OTP' };
  }
}

// =====================================================
// STEP 4: Create Verified Business
// =====================================================

export async function createVerifiedBusinessAction(formData: FormData) {
  try {
    const supabase = await createClient(); // Create server client
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'No autorizado. Inicia sesión con Google.' };
    }

    const raw = Object.fromEntries(formData.entries());
    const input = CreateVerifiedBusinessSchema.parse({
      ...raw,
      ownerId: user.id, // Now using 'user' from the auth check above
      verificationStatus: 'verified',
      verificationData: {
        verified_at: new Date().toISOString(),
        method: 'factiliza_kyb',
      },
    });

    // Check if phone was actually verified (lookup OTP table)
    const phoneVerified = await db.query.verificationOtps.findFirst({
      where: and(
        eq(verificationOtps.identifier, input.legalRepPhone!),
        eq(verificationOtps.verified, true),
      ),
    });

    if (!phoneVerified) {
      return { error: 'El número de teléfono del representante no ha sido verificado.' };
    }

    // Create the business
    const [newBusiness] = await db
      .insert(businesses)
      .values({
        ownerId: input.ownerId,
        name: input.name,
        slug: input.slug,
        taxId: input.taxId,
        personType: input.personType,
        legalRepName: input.legalRepName,
        legalRepPhone: input.legalRepPhone,
        legalRepEmail: input.legalRepEmail,
        whatsappNumber: input.businessPhone || input.legalRepPhone,
        email: input.businessEmail || input.legalRepEmail,
        address: input.address,
        // city: input.city, // Commented out: 'city' not in current schema. Use address field.
        verificationStatus: input.verificationStatus,
        verificationData: input.verificationData,
      })
      .returning();

    // Clean up used OTPs for this phone
    await db.delete(verificationOtps).where(eq(verificationOtps.identifier, input.legalRepPhone!));

    revalidatePath('/dashboard/businesses');
    return { success: true, businessId: newBusiness.id };
  } catch (error: any) {
    console.error('[KYB Create Business] Error:', error);
    return { error: error.message || 'Error al crear el negocio' };
  }
}
