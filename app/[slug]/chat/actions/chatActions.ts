'use server';

import { db } from '@/core/database/client';
import { chatSessions, messages } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

export async function startChatSession(data: {
  businessId: string;
  guestId: string;
  guestName: string;
  guestGender: string;
}) {
  try {
    // 1. Create or ensure chat session exists
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

    // 2. Send default store message
    await db.insert(messages).values({
      sessionId: newSession.id,
      isFromStore: true,
      content: `¡Hola ${data.guestName}! Bienvenido a nuestra tienda. ¿En qué podemos ayudarte hoy?`,
    });

    return { success: true, sessionId: newSession.id };
  } catch (error) {
    console.error('Error starting chat session:', error);
    return { success: false, error: 'No se pudo iniciar el chat' };
  }
}

export async function sendMessage(data: {
  sessionId: string;
  isFromStore: boolean;
  content: string;
}) {
  try {
    const [newMessage] = await db
      .insert(messages)
      .values({
        sessionId: data.sessionId,
        isFromStore: data.isFromStore,
        content: data.content,
      })
      .returning();

    return { success: true, message: newMessage };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'No se pudo enviar el mensaje' };
  }
}

export async function fetchMessages(sessionId: string) {
  try {
    const chatMessages = await db.query.messages.findMany({
      where: (messages, { eq }) => eq(messages.sessionId, sessionId),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });

    return { success: true, messages: chatMessages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error: 'No se pudo cargar los mensajes' };
  }
}

export async function getActiveChatSession(guestId: string, businessId: string) {
  try {
    const session = await db.query.chatSessions.findFirst({
      where: (chatSessions, { and, eq }) =>
        and(
          eq(chatSessions.guestId, guestId),
          eq(chatSessions.businessId, businessId),
          eq(chatSessions.status, 'active'),
        ),
      orderBy: (chatSessions, { desc }) => [desc(chatSessions.createdAt)],
    });

    return { success: true, session };
  } catch (error) {
    console.error('Error getting active chat session:', error);
    return { success: false, error: 'No se pudo obtener la sesión actual' };
  }
}

export async function fetchChatSessions(businessId: string) {
  try {
    const sessions = await db.query.chatSessions.findMany({
      where: (chatSessions, { eq }) => eq(chatSessions.businessId, businessId),
      orderBy: (chatSessions, { desc }) => [desc(chatSessions.createdAt)],
    });

    return { success: true, sessions };
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return { success: false, error: 'No se pudo cargar las sesiones de chat' };
  }
}

export async function deleteChatSession(sessionId: string) {
  try {
    await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return { success: false, error: 'No se pudo eliminar el chat' };
  }
}
