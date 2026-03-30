'use server';

import { db } from '@/core/database/client';
import { businesses, chatSessions, messages } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { and, eq } from 'drizzle-orm';

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

async function resolveSessionActor(sessionId: string, guestId?: string) {
  const session = await db.query.chatSessions.findFirst({
    where: eq(chatSessions.id, sessionId),
    columns: { id: true, businessId: true, guestId: true },
  });

  if (!session) {
    return { allowed: false as const, reason: 'Sesion no encontrada' };
  }

  const userId = await getAuthenticatedUserId();
  if (userId) {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, session.businessId),
      columns: { ownerId: true },
    });
    if (business?.ownerId === userId) {
      return { allowed: true as const, role: 'store' as const, session };
    }
  }

  if (guestId && session.guestId === guestId) {
    return { allowed: true as const, role: 'guest' as const, session };
  }

  return { allowed: false as const, reason: 'No autorizado' };
}

export async function startChatSession(data: {
  businessId: string;
  guestId: string;
  guestName: string;
  guestGender: string;
}) {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, data.businessId),
      columns: { id: true, isActive: true },
    });

    if (!business) {
      return { success: false, error: 'Negocio no encontrado' };
    }

    if (!business.isActive) {
      return { success: false, error: 'El negocio no está activo en este momento' };
    }

    const existingSession = await db.query.chatSessions.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.businessId, data.businessId),
          eq(table.guestId, data.guestId),
          eq(table.status, 'active'),
        ),
      columns: { id: true },
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    if (existingSession) {
      return { success: true, sessionId: existingSession.id };
    }

    const [newSession] = await db
      .insert(chatSessions)
      .values({
        businessId: data.businessId,
        guestId: data.guestId,
        guestName: data.guestName,
        guestGender: data.guestGender,
        status: 'active',
      })
      .returning();

    if (!newSession) {
      throw new Error('Failed to create chat session');
    }

    await db.insert(messages).values({
      sessionId: newSession.id,
      isFromStore: true,
      content: `Hola ${data.guestName}. Bienvenido a nuestra tienda. En que podemos ayudarte hoy?`,
    });

    return { success: true, sessionId: newSession.id };
  } catch (error) {
    console.error('Error starting chat session:', error);
    return { success: false, error: 'No se pudo iniciar el chat' };
  }
}

export async function sendMessage(data: {
  sessionId: string;
  isFromStore?: boolean;
  guestId?: string;
  content: string;
}) {
  try {
    const actor = await resolveSessionActor(data.sessionId, data.guestId);
    if (!actor.allowed) {
      return { success: false, error: actor.reason };
    }

    const [newMessage] = await db
      .insert(messages)
      .values({
        sessionId: data.sessionId,
        isFromStore: actor.role === 'store',
        content: data.content,
      })
      .returning();

    return { success: true, message: newMessage };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'No se pudo enviar el mensaje' };
  }
}

export async function fetchMessages(sessionId: string, guestId?: string) {
  try {
    const actor = await resolveSessionActor(sessionId, guestId);
    if (!actor.allowed) {
      return { success: false, error: actor.reason, messages: [] };
    }

    const chatMessages = await db.query.messages.findMany({
      where: (table, { eq }) => eq(table.sessionId, sessionId),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    });

    return { success: true, messages: chatMessages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error: 'No se pudo cargar los mensajes', messages: [] };
  }
}

export async function getActiveChatSession(guestId: string, businessId: string) {
  try {
    const session = await db.query.chatSessions.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.guestId, guestId), eq(table.businessId, businessId), eq(table.status, 'active')),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return { success: true, session };
  } catch (error) {
    console.error('Error getting active chat session:', error);
    return { success: false, error: 'No se pudo obtener la sesion actual' };
  }
}

export async function fetchChatSessions(businessId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: 'No autorizado', sessions: [] };
    }

    const business = await db.query.businesses.findFirst({
      where: and(eq(businesses.id, businessId), eq(businesses.ownerId, userId)),
      columns: { id: true },
    });

    if (!business) {
      return { success: false, error: 'No autorizado', sessions: [] };
    }

    const sessions = await db.query.chatSessions.findMany({
      where: (table, { eq }) => eq(table.businessId, businessId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return { success: true, sessions };
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return { success: false, error: 'No se pudo cargar las sesiones de chat', sessions: [] };
  }
}

export async function deleteChatSession(sessionId: string) {
  try {
    const actor = await resolveSessionActor(sessionId);
    if (!actor.allowed || actor.role !== 'store') {
      return { success: false, error: 'No autorizado' };
    }

    await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return { success: false, error: 'No se pudo eliminar el chat' };
  }
}
