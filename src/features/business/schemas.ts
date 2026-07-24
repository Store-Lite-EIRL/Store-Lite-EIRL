import { z } from 'zod';

/**
 * Schema for creating a business store.
 * Reflects the fields used in the multi-step creation form.
 */
export const createBusinessSchema = z.object({
  commercialName: z
    .string()
    .min(3, 'El nombre comercial debe tener al menos 3 caracteres')
    .max(100, 'El nombre comercial es demasiado largo'),
  personType: z
    .enum(['natural', 'juridica'], {
      error: 'Tipo de persona no válido',
    })
    .optional(), // ← BACKEND AUTO-DETECTS if not provided
  taxId: z
    .string()
    .min(11, 'El RUC/NIT debe tener al menos 11 caracteres')
    .max(20, 'El RUC/NIT es demasiado largo'),
  sector: z.string().min(2, 'El sector es obligatorio').max(50),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción es demasiado larga'),
  country: z.string().min(2, 'El país es obligatorio'),
  city: z.string().optional(),
  departamento: z.string().min(2, 'El departamento es obligatorio'),
  provincia: z.string().min(2, 'La provincia es obligatoria'),
  distrito: z.string().min(2, 'El distrito es obligatorio'),
  address: z.string().min(5, 'La dirección es obligatoria').max(255),
  email: z.string().email('Email institucional no válido'),
  phone: z.string().regex(/^\+?[1-9]\d{8,14}$/, 'El número de teléfono no es válido'),
  legalRepName: z.string().min(3, 'El nombre del representante es obligatorio'),
  legalRepRole: z.string().min(2, 'El cargo del representante es obligatorio'),
  legalRepPhone: z
    .string()
    .regex(/^\+?[1-9]\d{8,14}$/, 'El celular del representante no es válido'),
  legalRepEmail: z.string().email('Email del representante no válido'),
  storefrontTheme: z.string().optional(), // JSON string
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
