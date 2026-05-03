import { z } from 'zod';

export const chargeRequestSchema = z.object({
  token: z.string().min(1, 'El token de Culqi es obligatorio'),
  amount: z.number().int().min(100, 'El monto mínimo es S/ 1.00 (100 céntimos)'),
  currency: z.string().default('PEN'),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  businessId: z.string().uuid('ID de negocio inválido'),
  productId: z.string().uuid('ID de producto inválido'),
  metadata: z
    .object({
      orderNumber: z.string().optional(),
      shippingInfo: z
        .object({
          courier: z.string().optional(),
          department: z.string().optional(),
          province: z.string().optional(),
          district: z.string().optional(),
          address: z.string().optional(),
          agency: z.string().optional(),
          reference: z.string().optional(),
          phone: z.string().optional(),
          cost: z.union([z.number(), z.string()]).optional(),
          dni: z.string().optional(),
        })
        .optional(),
      cartItems: z
        .array(
          z.object({
            id: z.string().uuid(),
            quantity: z.number().int().min(1),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type ChargeRequestInput = z.infer<typeof chargeRequestSchema>;
