'use server';

import { env } from '@/config/env';
import { resolveBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import {
  businessInvitations,
  businessTeamMembers,
  businessTeamRoles,
  businesses,
} from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// =====================================================
// TYPES
// =====================================================

export interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  joinedAt: Date;
}

export interface InvitationInfo {
  code: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Creates a Supabase client bound to the current user's session
 */
async function createUserAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

/**
 * Creates a Supabase admin client (service role)
 */
function createAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Generate a random invitation code (XXXX-XXXX format)
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, 1, I to avoid confusion
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash the code for storage using Web Crypto API
 */
async function hashCode(code: string): Promise<string> {
  // Use Web Crypto API for server-side hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(`store-lite-team-2026:${code}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if user is the owner of a business
 */
async function assertOwnership(
  businessId: string,
): Promise<{ userId: string | null; error: string | null }> {
  const supabase = await createUserAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, error: 'No autenticado.' };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });

  if (!business || business.ownerId !== user.id) {
    return { userId: user.id, error: 'No tienes permiso para realizar esta acción.' };
  }

  return { userId: user.id, error: null };
}

/**
 * Get current team member count (owner + members)
 */
async function getTeamMemberCount(businessId: string): Promise<number> {
  const members = await db.query.businessTeamMembers.findMany({
    where: eq(businessTeamMembers.businessId, businessId),
    columns: { id: true },
  });
  return members.length + 1; // +1 for owner
}

// =====================================================
// SERVER ACTIONS
// =====================================================

/**
 * Generate a new invitation code for a business
 * Only the owner can call this action
 */
export async function generateInvitationCode(
  businessId: string,
): Promise<ActionState & { code?: string }> {
  // 0. Validate input
  const { businessIdParamSchema } = await import('@/features/team/schemas');
  const validation = businessIdParamSchema.safeParse({ businessId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  // 1. Verify ownership
  const ownership = await assertOwnership(businessId);
  if (ownership.error) {
    return { success: false, error: ownership.error };
  }

  const userId = ownership.userId!;

  // 2. Check entitlements (must be business_pro or enterprise_ai)
  const entitlements = await getBusinessEntitlements(businessId);
  if (entitlements.maxTeamMembers <= 1) {
    return {
      success: false,
      error: 'Tu plan no incluye la función de equipos. Actualiza a Business Pro o superior.',
    };
  }

  // 3. Check if team is at capacity
  const currentCount = await getTeamMemberCount(businessId);
  if (currentCount >= entitlements.maxTeamMembers) {
    return {
      success: false,
      error: `Has alcanzado el límite de ${entitlements.maxTeamMembers} miembros para tu plan.`,
    };
  }

  // 4. Check rate limit - max 3 active codes per business
  const activeCodes = await db.query.businessInvitations.findMany({
    where: and(
      eq(businessInvitations.businessId, businessId),
      or(isNull(businessInvitations.expiresAt), sql`${businessInvitations.expiresAt} > now()`),
    ),
    columns: { id: true },
  });

  if (activeCodes.length >= 3) {
    return {
      success: false,
      error: 'Tienes demasiados códigos activos. Elimina uno antes de generar uno nuevo.',
    };
  }

  // 5. Generate and save new code
  const code = generateCode();
  const codeHash = await hashCode(code);

  try {
    // Invalidate old codes (soft delete by setting expires_at to now)
    // Note: We keep them for audit but they won't be valid anymore

    await db.insert(businessInvitations).values({
      businessId,
      code,
      codeHash,
      maxUses: null, // unlimited
      usedCount: 0,
      expiresAt: null, // never expires
      createdBy: userId,
    });

    revalidatePath(`/${businessId}/settings`, 'page');

    return {
      success: true,
      message: 'Código de invitación generado exitosamente.',
      code,
    };
  } catch (err) {
    console.error('[generateInvitationCode] Error:', err);
    return { success: false, error: 'Error al generar el código de invitación.' };
  }
}

/**
 * Get team members for a business
 */
export async function getTeamMembers(
  businessId: string,
): Promise<ActionState & { members?: TeamMember[] }> {
  // 0. Validate input
  const { businessIdParamSchema } = await import('@/features/team/schemas');
  const validation = businessIdParamSchema.safeParse({ businessId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  // 1. Verify ownership or membership
  const supabase = await createUserAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autenticado.' };
  }

  // Check if user is owner or team member
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });

  if (!business) {
    return { success: false, error: 'Negocio no encontrado.' };
  }

  const isOwner = business.ownerId === user.id;
  const isMember = await db.query.businessTeamMembers.findFirst({
    where: and(
      eq(businessTeamMembers.businessId, businessId),
      eq(businessTeamMembers.userId, user.id),
    ),
  });

  if (!isOwner && !isMember) {
    return { success: false, error: 'No tienes acceso a este equipo.' };
  }

  // 2. Get owner info with relation
  const ownerInfo = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
    with: {
      owner: {
        columns: { id: true, email: true, fullName: true, avatarUrl: true },
      },
    },
  });

  const members: TeamMember[] = [];

  // Add owner as first member
  if (ownerInfo?.owner) {
    members.push({
      id: 'owner',
      userId: ownerInfo.owner.id,
      email: ownerInfo.owner.email,
      fullName: ownerInfo.owner.fullName,
      avatarUrl: ownerInfo.owner.avatarUrl,
      role: 'owner',
      joinedAt: new Date(), // Owner has no join date in this table
    });
  }

  // 3. Get team members
  const teamMembers = await db.query.businessTeamMembers.findMany({
    where: eq(businessTeamMembers.businessId, businessId),
    with: {
      user: {
        columns: { id: true, email: true, fullName: true, avatarUrl: true },
      },
    },
  });

  for (const member of teamMembers) {
    if (member.user) {
      members.push({
        id: member.id,
        userId: member.user.id,
        email: member.user.email,
        fullName: member.user.fullName,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        joinedAt: member.joinedAt,
      });
    }
  }

  return { success: true, members };
}

/**
 * Get current invitation code for a business
 */
export async function getInvitationCode(
  businessId: string,
): Promise<ActionState & { invitation?: InvitationInfo }> {
  // 0. Validate input
  const { businessIdParamSchema } = await import('@/features/team/schemas');
  const validation = businessIdParamSchema.safeParse({ businessId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  // Only owner can see the code
  const ownership = await assertOwnership(businessId);
  if (ownership.error) {
    return { success: false, error: ownership.error };
  }

  // Get the most recent active invitation
  const invitation = await db.query.businessInvitations.findFirst({
    where: and(
      eq(businessInvitations.businessId, businessId),
      or(isNull(businessInvitations.expiresAt), sql`${businessInvitations.expiresAt} > now()`),
    ),
    orderBy: (invitations, { desc }) => [desc(invitations.createdAt)],
  });

  if (!invitation) {
    return { success: true, invitation: undefined };
  }

  return {
    success: true,
    invitation: {
      code: invitation.code,
      maxUses: invitation.maxUses,
      usedCount: invitation.usedCount,
      expiresAt: invitation.expiresAt,
    },
  };
}

/**
 * Revoke/delete an invitation code
 */
export async function revokeInvitationCode(
  businessId: string,
  invitationId: string,
): Promise<ActionState> {
  // 0. Validate input
  const { revokeInvitationSchema } = await import('@/features/team/schemas');
  const validation = revokeInvitationSchema.safeParse({ businessId, invitationId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  const ownership = await assertOwnership(businessId);
  if (ownership.error) {
    return { error: ownership.error };
  }

  try {
    await db
      .update(businessInvitations)
      .set({ expiresAt: new Date() }) // Invalidate by setting expiry to now
      .where(
        and(
          eq(businessInvitations.id, invitationId),
          eq(businessInvitations.businessId, businessId),
        ),
      );

    revalidatePath(`/${businessId}/settings`, 'page');

    return { success: true, message: 'Código de invitación revocado.' };
  } catch (err) {
    console.error('[revokeInvitationCode] Error:', err);
    return { success: false, error: 'Error al revocar el código.' };
  }
}

/**
 * Remove a team member (only owner can do this)
 */
export async function removeTeamMember(
  businessId: string,
  memberUserId: string,
): Promise<ActionState> {
  // 0. Validate input
  const { memberActionSchema } = await import('@/features/team/schemas');
  const validation = memberActionSchema.safeParse({ businessId, memberUserId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  const ownership = await assertOwnership(businessId);
  if (ownership.error) {
    return { error: ownership.error };
  }

  // Can't remove yourself
  if (ownership.userId === memberUserId) {
    return { success: false, error: 'No puedes eliminarte a ti mismo del equipo.' };
  }

  try {
    await db
      .delete(businessTeamMembers)
      .where(
        and(
          eq(businessTeamMembers.businessId, businessId),
          eq(businessTeamMembers.userId, memberUserId),
        ),
      );

    revalidatePath(`/${businessId}/settings`, 'page');

    return { success: true, message: 'Miembro eliminado del equipo.' };
  } catch (err) {
    console.error('[removeTeamMember] Error:', err);
    return { success: false, error: 'Error al eliminar el miembro.' };
  }
}

/**
 * Leave a team (member removes themselves)
 */
export async function leaveTeam(businessId: string): Promise<ActionState> {
  // 0. Validate input
  const { businessIdParamSchema } = await import('@/features/team/schemas');
  const validation = businessIdParamSchema.safeParse({ businessId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  const supabase = await createUserAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autenticado.' };
  }

  try {
    await db
      .delete(businessTeamMembers)
      .where(
        and(
          eq(businessTeamMembers.businessId, businessId),
          eq(businessTeamMembers.userId, user.id),
        ),
      );

    revalidatePath('/', 'page');

    return { success: true, message: 'Has salido del equipo.' };
  } catch (err) {
    console.error('[leaveTeam] Error:', err);
    return { success: false, error: 'Error al salir del equipo.' };
  }
}

/**
 * Join a team with invitation code
 * Returns info about the team and business if user has their own business
 */
export async function joinTeam(
  slug: string,
  code: string,
): Promise<
  ActionState & {
    business?: { id: string; name: string; slug: string };
    hasOwnBusiness?: boolean;
    ownBusinessId?: string;
  }
> {
  // 0. Validate input
  const { joinTeamSchema } = await import('@/features/team/schemas');
  const validation = joinTeamSchema.safeParse({ slug, code: code.toUpperCase() });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  // 1. Verify user is authenticated
  const supabase = await createUserAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Debes iniciar sesión para unirte a un equipo.' };
  }

  // 2. Find business by slug
  const business = (await resolveBusinessSlug(slug))?.business;

  if (!business) {
    return { success: false, error: 'Negocio no encontrado. Verificá el nombre.' };
  }

  // 3. Find invitation by code AND business
  const invitation = await db.query.businessInvitations.findFirst({
    where: and(
      eq(businessInvitations.businessId, business.id),
      eq(businessInvitations.code, code.toUpperCase()),
      or(isNull(businessInvitations.expiresAt), sql`${businessInvitations.expiresAt} > now()`),
    ),
  });

  if (!invitation) {
    return { success: false, error: 'Código de invitación inválido o expirado para este negocio.' };
  }

  // 5. Check if already a member
  const existingMembership = await db.query.businessTeamMembers.findFirst({
    where: and(
      eq(businessTeamMembers.businessId, business.id),
      eq(businessTeamMembers.userId, user.id),
    ),
  });

  if (existingMembership) {
    return { success: false, error: 'Ya eres miembro de este equipo.' };
  }

  // 6. Check if user is the owner of this business
  if (business.ownerId === user.id) {
    return { success: false, error: 'Ya eres el dueño de este negocio.' };
  }

  // 7. Check business entitlements
  const entitlements = await getBusinessEntitlements(business.id);
  if (entitlements.maxTeamMembers <= 1) {
    return { success: false, error: 'Este negocio no acepta miembros de equipo.' };
  }

  // 8. Check if team is at capacity
  const currentCount = await getTeamMemberCount(business.id);
  if (currentCount >= entitlements.maxTeamMembers) {
    return {
      success: false,
      error: `El equipo ya está completo (${entitlements.maxTeamMembers} miembros).`,
    };
  }

  // 9. Check if user has their own business
  const userOwnsBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, user.id),
    columns: { id: true },
  });

  // 10. If user has own business, return info for the webhook/modal decision
  if (userOwnsBusiness) {
    return {
      success: true,
      message: 'Tienes un negocio propio. ¿Deseas cambiarte a este equipo?',
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      hasOwnBusiness: true,
      ownBusinessId: userOwnsBusiness.id,
    };
  }

  // 11. User has no own business - proceed to join directly
  try {
    await db.insert(businessTeamMembers).values({
      businessId: business.id,
      userId: user.id,
      role: 'member',
      invitationId: invitation.id,
    });

    // Update used count
    await db
      .update(businessInvitations)
      .set({ usedCount: invitation.usedCount + 1 })
      .where(eq(businessInvitations.id, invitation.id));

    revalidatePath('/', 'page');

    return {
      success: true,
      message: `¡Bienvenido al equipo de ${business.name}!`,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
    };
  } catch (err) {
    console.error('[joinTeam] Error:', err);
    return { success: false, error: 'Error al unirte al equipo.' };
  }
}

/**
 * Confirm joining a team (after user decides to leave their own business)
 */
export async function confirmJoinTeam(code: string, ownBusinessId: string): Promise<ActionState> {
  // 0. Validate input
  const { confirmJoinTeamSchema } = await import('@/features/team/schemas');
  const validation = confirmJoinTeamSchema.safeParse({ code: code.toUpperCase(), ownBusinessId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  // 1. Verify user is authenticated
  const supabase = await createUserAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autenticado.' };
  }

  // 2. Verify user owns the specified business
  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, ownBusinessId), eq(businesses.ownerId, user.id)),
    columns: { id: true, name: true },
  });

  if (!business) {
    return { success: false, error: 'Negocio no encontrado o no te pertenece.' };
  }

  // 3. Verify invitation code
  const invitation = await db.query.businessInvitations.findFirst({
    where: eq(businessInvitations.code, code.toUpperCase()),
    with: {
      business: {
        columns: { id: true, name: true },
      },
    },
  });

  if (!invitation) {
    return { success: false, error: 'Código de invitación inválido.' };
  }

  // 4. Check team capacity again
  const entitlements = await getBusinessEntitlements(invitation.businessId);
  const currentCount = await getTeamMemberCount(invitation.businessId);

  if (currentCount >= entitlements.maxTeamMembers) {
    return {
      success: false,
      error: `El equipo ya está completo (${entitlements.maxTeamMembers} miembros).`,
    };
  }

  // 5. Join the team (but keep ownership of own business)
  try {
    await db.insert(businessTeamMembers).values({
      businessId: invitation.businessId,
      userId: user.id,
      role: 'member',
      invitationId: invitation.id,
    });

    // Update used count
    await db
      .update(businessInvitations)
      .set({ usedCount: invitation.usedCount + 1 })
      .where(eq(businessInvitations.id, invitation.id));

    revalidatePath('/', 'page');

    return {
      success: true,
      message: `Te has unido al equipo de ${invitation.business.name}. Puedes volver a tu negocio en cualquier momento.`,
    };
  } catch (err) {
    console.error('[confirmJoinTeam] Error:', err);
    return { success: false, error: 'Error al confirmar la unión al equipo.' };
  }
}

/**
 * Get all teams a user is a member of
 */
export async function getUserTeams(): Promise<
  ActionState & { teams?: { businessId: string; name: string; slug: string; role: string }[] }
> {
  const supabase = await createUserAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autenticado.' };
  }

  try {
    const memberships = await db.query.businessTeamMembers.findMany({
      where: eq(businessTeamMembers.userId, user.id),
      with: {
        business: {
          columns: { id: true, name: true, slug: true },
        },
      },
    });

    const teams = memberships.map((m) => ({
      businessId: m.business.id,
      name: m.business.name,
      slug: m.business.slug,
      role: m.role,
    }));

    return { success: true, teams };
  } catch (err) {
    console.error('[getUserTeams] Error:', err);
    return { success: false, error: 'Error al obtener tus equipos.' };
  }
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  businessId: string,
  memberUserId: string,
  newRole: 'admin' | 'member',
): Promise<ActionState> {
  // 0. Validate input
  const { updateMemberRoleSchema } = await import('@/features/team/schemas');
  const validation = updateMemberRoleSchema.safeParse({ businessId, memberUserId, newRole });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  const ownership = await assertOwnership(businessId);
  if (ownership.error) {
    return { error: ownership.error };
  }

  // Can't change own role
  if (ownership.userId === memberUserId) {
    return { success: false, error: 'No puedes cambiar tu propio rol.' };
  }

  try {
    await db
      .update(businessTeamMembers)
      .set({ role: newRole })
      .where(
        and(
          eq(businessTeamMembers.businessId, businessId),
          eq(businessTeamMembers.userId, memberUserId),
        ),
      );

    revalidatePath(`/${businessId}/settings`, 'page');

    return {
      success: true,
      message: `Rol actualizado a ${newRole === 'admin' ? 'Administrador' : 'Miembro'}.`,
    };
  } catch (err) {
    console.error('[updateMemberRole] Error:', err);
    return { success: false, error: 'Error al actualizar el rol.' };
  }
}

/**
 * Update a member's custom permissions (override role defaults)
 */
export async function updateMemberPermissions(
  businessId: string,
  memberUserId: string,
  permissions: string[],
): Promise<ActionState> {
  // 0. Validate input
  const { updateMemberPermissionsSchema } = await import('@/features/team/schemas');
  const validation = updateMemberPermissionsSchema.safeParse({
    businessId,
    memberUserId,
    permissions,
  });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  const ownership = await assertOwnership(businessId);
  if (ownership.error) {
    return { error: ownership.error };
  }

  // Can't change own permissions
  if (ownership.userId === memberUserId) {
    return { success: false, error: 'No puedes cambiar tus propios permisos.' };
  }

  // Validate permissions using the master list from PERMISSION_LABELS
  const { PERMISSION_LABELS } = await import('@/lib/permissions/definitions');
  const validPermissions = Object.keys(PERMISSION_LABELS);

  const invalidPermissions = permissions.filter((p) => !validPermissions.includes(p));
  if (invalidPermissions.length > 0) {
    return {
      success: false,
      error: `Permisos inválidos: ${invalidPermissions.join(', ')}`,
    };
  }

  try {
    await db
      .update(businessTeamMembers)
      .set({ customPermissions: permissions as any })
      .where(
        and(
          eq(businessTeamMembers.businessId, businessId),
          eq(businessTeamMembers.userId, memberUserId),
        ),
      );

    revalidatePath(`/${businessId}/settings`, 'page');

    return { success: true, message: 'Permisos actualizados.' };
  } catch (err) {
    console.error('[updateMemberPermissions] Error:', err);
    return { success: false, error: 'Error al actualizar los permisos.' };
  }
}

/**
 * Update default permissions for a role in a business
 */
export async function updateRolePermissions(
  businessId: string,
  role: string,
  permissions: string[],
): Promise<ActionState> {
  // 0. Validate input
  const { updateRolePermissionsSchema } = await import('@/features/team/schemas');
  const validation = updateRolePermissionsSchema.safeParse({ businessId, role, permissions });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  const ownership = await assertOwnership(businessId);
  if (ownership.error) {
    return { error: ownership.error };
  }

  // Only for admin and member roles
  if (!['admin', 'member'].includes(role)) {
    return { success: false, error: 'Rol inválido.' };
  }

  try {
    // Upsert the role permissions
    const existingRole = await db.query.businessTeamRoles.findFirst({
      where: and(eq(businessTeamRoles.businessId, businessId), eq(businessTeamRoles.role, role)),
    });

    if (existingRole) {
      await db
        .update(businessTeamRoles)
        .set({
          permissions: permissions as any,
          updatedAt: new Date(),
        })
        .where(eq(businessTeamRoles.id, existingRole.id));
    } else {
      await db.insert(businessTeamRoles).values({
        businessId,
        role,
        permissions: permissions as any,
        isDefault: true,
      });
    }

    revalidatePath(`/${businessId}/settings`, 'page');

    return { success: true, message: `Permisos del rol ${role} actualizados.` };
  } catch (err) {
    console.error('[updateRolePermissions] Error:', err);
    return { success: false, error: 'Error al actualizar los permisos del rol.' };
  }
}

/**
 * Remove custom permissions override from a member (revert to role defaults)
 */
export async function removeMemberPermissionsOverride(
  businessId: string,
  memberUserId: string,
): Promise<ActionState> {
  // 0. Validate input
  const { memberActionSchema } = await import('@/features/team/schemas');
  const validation = memberActionSchema.safeParse({ businessId, memberUserId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  const ownership = await assertOwnership(businessId);
  if (ownership.error) {
    return { error: ownership.error };
  }

  try {
    await db
      .update(businessTeamMembers)
      .set({ customPermissions: null })
      .where(
        and(
          eq(businessTeamMembers.businessId, businessId),
          eq(businessTeamMembers.userId, memberUserId),
        ),
      );

    revalidatePath(`/${businessId}/settings`, 'page');

    return { success: true, message: 'Se restauraron los permisos por defecto del rol.' };
  } catch (err) {
    console.error('[removeMemberPermissionsOverride] Error:', err);
    return { success: false, error: 'Error al restaurar los permisos.' };
  }
}
