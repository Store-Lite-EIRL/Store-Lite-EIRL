import { z } from 'zod';

// Reusable parts
const businessIdSchema = z.string().uuid('ID de negocio inválido');
const userIdSchema = z.string().uuid('ID de usuario inválido');
const roleSchema = z.enum(['admin', 'member'], {
  errorMap: () => ({ message: 'Rol inválido. Debe ser admin o member' }),
});
const codeSchema = z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Formato de código inválido (XXXX-XXXX)');

export const businessIdParamSchema = z.object({
  businessId: businessIdSchema,
});

export const revokeInvitationSchema = z.object({
  businessId: businessIdSchema,
  invitationId: z.string().uuid('ID de invitación inválido'),
});

export const memberActionSchema = z.object({
  businessId: businessIdSchema,
  memberUserId: userIdSchema,
});

export const joinTeamSchema = z.object({
  slug: z.string().min(2, 'El slug es demasiado corto').max(100),
  code: codeSchema,
});

export const confirmJoinTeamSchema = z.object({
  code: codeSchema,
  ownBusinessId: businessIdSchema,
});

export const updateMemberRoleSchema = z.object({
  businessId: businessIdSchema,
  memberUserId: userIdSchema,
  newRole: roleSchema,
});

export const updateMemberPermissionsSchema = z.object({
  businessId: businessIdSchema,
  memberUserId: userIdSchema,
  permissions: z.array(z.string()),
});

export const updateRolePermissionsSchema = z.object({
  businessId: businessIdSchema,
  role: z.string().min(2, 'El rol es obligatorio'),
  permissions: z.array(z.string()),
});
