// =====================================================
// KYB SCHEMAS (Zod Validation)
// =====================================================
// Description: Validation schemas for KYB verification flow
// =====================================================

import { z } from 'zod';

// Helper regex
const rucRegex = /^\d{11}$/;
const dniRegex = /^\d{8}$/;
const phoneRegex = /^9\d{8}$/; // Peru mobile format

// =====================================================
// Step1: RUC/DNI Validation
// =====================================================

export const VerifyIdentitySchema = z.object({
  personType: z.enum(['natural', 'juridica']).optional(), // ← BACKEND AUTO-DETECTS if not provided
  // If natural, validate DNI (8 digits). If juridica, validate RUC (11 digits)
  documentNumber: z.string().refine(
    (val) => {
      if (val.length === 8) return dniRegex.test(val);
      if (val.length === 11) return rucRegex.test(val);
      return false;
    },
    { message: 'Invalid document number length (must be 8 or 11 digits)' },
  ),
});

export type VerifyIdentityInput = z.infer<typeof VerifyIdentitySchema>;

// =====================================================
// Step 2: Representative Data
// =====================================================

export const VerifyRepresentativeSchema = z.object({
  businessId: z.string().uuid(), // Temp ID or real ID
  dni: z.string().regex(dniRegex, 'DNI must be 8 digits'),
  fullName: z.string().min(3, 'Full name is required'),
  // Additional business data (for juridica)
  businessName: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
});

export type VerifyRepresentativeInput = z.infer<typeof VerifyRepresentativeSchema>;

// =====================================================
// Step 3: OTP Request & Verification
// =====================================================

export const RequestOtpSchema = z.object({
  identifier: z.string().regex(phoneRegex, 'Must be a valid Peruvian phone number (9XXXXXXXXX)'),
  type: z.enum(['phone', 'email']).default('phone'),
  // Country prefix for Twilio formatting (e.g. "+51" for Peru)
  // Only used server-side for Twilio — the DB stores the raw identifier
  countryPrefix: z.string().default('+51'),
});

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;

export const VerifyOtpSchema = z.object({
  identifier: z.string(),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

// =====================================================
// Step 4: Final Business Creation
// =====================================================

export const CreateVerifiedBusinessSchema = z.object({
  // Owner (from session)
  ownerId: z.string().uuid(),
  // Data from Step 1 & 2
  personType: z.enum(['natural', 'juridica']),
  taxId: z.string(), // RUC
  legalRepName: z.string(), // Full name of representative
  legalRepPhone: z.string(), // Verified phone
  legalRepEmail: z.string().email(),
  // Business specific (from Step 4)
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional(),
  name: z.string().min(3), // Business name (for juridica) or trade name
  address: z.string().optional(),
  slug: z.string().min(3),
  // Verification status
  verificationStatus: z.literal('verified'),
  verificationData: z.record(z.string(), z.any()).default({}),
});

export type CreateVerifiedBusinessInput = z.infer<typeof CreateVerifiedBusinessSchema>;
