// =====================================================
// LEGAL — Zod Schemas
// =====================================================

import { z } from 'zod';

// Shared field — transforms empty string to null
export const legalContentField = z
  .string()
  .max(10000, 'El texto no puede exceder los 10,000 caracteres')
  .nullable()
  .optional()
  .transform((v) => (v === '' ? null : v));

export const legalContentSchema = z.object({
  termsContent: legalContentField,
  returnsContent: legalContentField,
  complaintContactEmail: z
    .string()
    .email('Email inválido')
    .max(200)
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
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
  // 🕵️ Honeypot: campo invisible para bots. Si tiene valor, se ignora el envío.
  fax: z.string().optional().default(''),
});

export const complaintResponseSchema = z.object({
  response: z
    .string()
    .min(1, 'La respuesta no puede estar vacía')
    .max(5000, 'La respuesta no puede exceder 5,000 caracteres'),
});
