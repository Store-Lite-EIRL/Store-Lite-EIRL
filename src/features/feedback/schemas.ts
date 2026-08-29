// =====================================================
// FEEDBACK — Validation Schemas (Zod)
// =====================================================

import { z } from 'zod';

// ── Submit feedback schema ──

export const submitFeedbackSchema = z.object({
  businessId: z.string().uuid('ID de negocio no válido'),
  requestType: z.enum(['support', 'feedback', 'complaint'], {
    message: 'Tipo de solicitud no válido',
  }),
  category: z.enum(['bug', 'suggestion', 'question', 'other'], {
    message: 'Categoría no válida',
  }),
  subject: z
    .string()
    .min(5, 'El asunto debe tener al menos 5 caracteres')
    .max(200, 'El asunto no puede exceder 200 caracteres'),
  message: z
    .string()
    .min(20, 'El mensaje debe tener al menos 20 caracteres')
    .max(5000, 'El mensaje no puede exceder 5000 caracteres'),
});

export type SubmitFeedbackSchema = z.infer<typeof submitFeedbackSchema>;

// ── Respond to ticket schema ──

export const respondToTicketSchema = z.object({
  ticketId: z.string().uuid('ID de ticket no válido'),
  message: z
    .string()
    .min(10, 'La respuesta debe tener al menos 10 caracteres')
    .max(5000, 'La respuesta no puede exceder 5000 caracteres'),
});

export type RespondToTicketSchema = z.infer<typeof respondToTicketSchema>;
