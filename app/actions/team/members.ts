'use server';

import { db } from '@/core/database/client';
import { businessTeamMembers, businesses } from '@/core/database/schema';
import type { ActionState } from '@/types/actions';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { TeamMember } from './_helpers';
import { assertOwnership, createUserAuthClient } from './_helpers';

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
