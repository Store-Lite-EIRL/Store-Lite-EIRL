'use client';

import { createClient } from '@/lib/supabase/client';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { useEffect, useRef, useState } from 'react';
import {
  deleteChatSession,
  fetchChatSessions,
  fetchMessages,
  sendMessage,
} from '../actions/chatActions';
import styles from '../messages.module.css';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { DeleteChatDialog } from './DeleteChatDialog';

const DEBUG_ABORTS = process.env.NEXT_PUBLIC_DEBUG_ABORTS === '1';

function chatDebug(message: string, payload?: Record<string, unknown>) {
  if (!DEBUG_ABORTS) return;
  console.warn('[ChatClientDebug]', message, payload ?? {});
}

export interface Chat {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  avatarUrl: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  chatId: string;
  imageUrl?: string;
}

interface ChatClientProps {
  slug: string;
  storeName: string;
  storeDescription: string;
  businessId: string;
}

export function ChatClient({ slug, storeName, storeDescription, businessId }: ChatClientProps) {
  const supabase = createClient();
  const [sessions, setSessions] = useState<Chat[]>([]); // Renamed from chats
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const selectedSessionRef = useRef<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'primary' | 'secondary' | 'tertiary';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [isShareConfirmed, setIsShareConfirmed] = useState(false);

  useEffect(() => {
    selectedSessionRef.current = selectedSession;
    chatDebug('selectedSession:update', { selectedSessionId: selectedSession?.id ?? null });
  }, [selectedSession]);

  // Load chat sessions
  useEffect(() => {
    async function loadSessions() {
      setIsSessionsLoading(true);
      setError(null);
      try {
        const result = await fetchChatSessions(businessId);
        if (result.success && result.sessions) {
          const mappedChats: Chat[] = result.sessions.map((s) => ({
            id: s.id,
            name: s.guestName || 'Invitado',
            preview: 'Chat iniciado',
            time: s.createdAt
              ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
            unread: 0,
            online: true,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.guestName || s.id}`,
          }));
          setSessions(mappedChats);
        } else {
          setError(result.error || 'Error al cargar sesiones');
        }
      } catch (err) {
        setError('Error inesperado al cargar sesiones');
      } finally {
        setIsSessionsLoading(false);
      }
    }

    loadSessions();
  }, [businessId]);

  // Load messages when selection changes
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]); // Clear messages if no session is selected
      return;
    }

    const loadMessages = async () => {
      setIsMessagesLoading(true);
      try {
        const result = await fetchMessages(selectedSession.id);
        if (result.success && result.messages) {
          const mappedMessages: Message[] = result.messages.map((m) => ({
            id: String(m.id),
            text: m.content || '',
            sender: m.isFromStore ? 'me' : 'them',
            time: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
            chatId: String(m.sessionId),
          }));
          setMessages(mappedMessages);
        } else {
          console.error('Error loading messages:', result.error);
          setMessages([]);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }
    };
    loadMessages();
  }, [selectedSession]);

  // Real-time subscription for sessions and messages
  useEffect(() => {
    chatDebug('subscriptions:start', { businessId });
    // Subscribe to new chat sessions for this business
    const sessionChannel = supabase
      .channel('public:chat_sessions_owner')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions',
          filter: `business_id=eq.${businessId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newSession = payload.new;
          chatDebug('sessionChannel:insert', { sessionId: String(newSession.id) });
          const newChat: Chat = {
            id: String(newSession.id),
            name: (newSession.guest_name as string) || 'Invitado',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${String(newSession.guest_name || newSession.id)}`,
            preview: '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: 0,
            online: true,
          };
          setSessions((prev) => {
            if (prev.some((c) => c.id === newChat.id)) return prev;
            return [newChat, ...prev];
          });
        },
      )
      .subscribe();

    // Subscribe to messages
    const messageChannel = supabase
      .channel('public:messages_owner')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload: { new: Record<string, unknown> }) => {
          const newMessage = payload.new;
          chatDebug('messageChannel:insert', {
            sessionId: String(newMessage.session_id),
            messageId: String(newMessage.id),
          });

          const mappedMsg: Message = {
            id: String(newMessage.id),
            text: String(newMessage.content ?? ''),
            sender: newMessage.is_from_store ? 'me' : 'them',
            time: new Date(String(newMessage.created_at)).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            chatId: String(newMessage.session_id),
          };

          // Update message list if it's the current chat
          if (
            selectedSessionRef.current &&
            String(newMessage.session_id) === selectedSessionRef.current.id
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === mappedMsg.id)) return prev;
              return [...prev, mappedMsg];
            });
          }

          // Update preview in sidebar for the affected chat
          setSessions((prev) =>
            prev.map((chat) =>
              chat.id === String(newMessage.session_id)
                ? { ...chat, preview: mappedMsg.text, time: mappedMsg.time }
                : chat,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      chatDebug('subscriptions:cleanup', { businessId });
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [businessId, supabase]);

  // Toggle body class for mobile navbar visibility
  useEffect(() => {
    if (selectedSession) {
      document.body.classList.add('is-chat-active');
    } else {
      document.body.classList.remove('is-chat-active');
    }
    return () => {
      document.body.classList.remove('is-chat-active');
    };
  }, [selectedSession]);

  const filteredSessions = sessions.filter((chat) =>
    chat.name.toLowerCase().includes(chatSearchQuery.toLowerCase()),
  );

  const activeMessages = messages.filter(
    (m) =>
      selectedSession &&
      m.chatId === selectedSession.id &&
      (m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
        (m.sender === 'me' && 'envío'.includes(messageSearchQuery.toLowerCase()))),
  );

  const handleSendMessage = async (text: string) => {
    if (!selectedSession) return;

    const result = await sendMessage({
      sessionId: selectedSession.id,
      isFromStore: true,
      content: text,
    });

    if (!result.success) {
      setSnackbar({
        open: true,
        message: 'Error al enviar mensaje',
        severity: 'error',
      });
    }
  };

  const handleSendImage = (_imageUrl: string) => {
    // For now, image sending is not fully implemented in actions
    setSnackbar({
      open: true,
      message: 'El envío de imágenes estará disponible pronto',
      severity: 'warning',
    });
  };

  const handleDeleteChat = () => {
    if (!selectedSession) return;
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSession) return;

    const result = await deleteChatSession(selectedSession.id);

    if (result.success) {
      setSessions((prev) => prev.filter((c) => c.id !== selectedSession.id));
      setMessages((prev) => prev.filter((m) => m.chatId !== selectedSession.id));
      setSelectedSession(null);
      setIsDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Chat eliminado exitosamente',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: result.error || 'Error al eliminar el chat',
        severity: 'error',
      });
      setIsDeleteDialogOpen(false);
    }
  };

  const handleShareChat = () => {
    if (!selectedSession || isShareConfirmed) return;

    navigator.clipboard.writeText(window.location.href).catch((err) => {
      console.error('Failed to copy:', err);
    });

    setIsShareConfirmed(true);
    setSnackbar({
      open: true,
      message: 'Enlace de chat copiado al portapapeles',
      severity: 'success',
    });

    setTimeout(() => {
      setIsShareConfirmed(false);
    }, 2000);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className={`${styles.chatContainer} ${selectedSession ? styles.hasSelectedChat : ''}`}>
      <div className={styles.sidebarWrapper}>
        <ChatSidebar
          chats={filteredSessions}
          selectedChatId={selectedSession?.id || null}
          onSelectChat={(id) => setSelectedSession(sessions.find((s) => s.id === id) || null)}
          searchQuery={chatSearchQuery}
          onSearchChange={setChatSearchQuery}
          isLoading={isSessionsLoading}
        />
      </div>
      <div className={styles.windowWrapper}>
        <ChatWindow
          session={selectedSession}
          messages={activeMessages}
          storeName={storeName}
          storeDescription={
            storeDescription ||
            'Gestiona las conversaciones con tus clientes desde aquí. Selecciona un chat para comenzar.'
          }
          onSendMessage={handleSendMessage}
          onSendImage={handleSendImage}
          searchQuery={messageSearchQuery}
          onSearchChange={setMessageSearchQuery}
          onDeleteChat={handleDeleteChat}
          onShareChat={handleShareChat}
          isShareConfirmed={isShareConfirmed}
          onBack={() => setSelectedSession(null)}
          slug={slug}
        />
      </div>
      <DeleteChatDialog
        open={isDeleteDialogOpen}
        chatName={selectedSession?.name ?? null}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
      <AlertSnackbar
        open={snackbar.open}
        description={snackbar.message}
        color={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </div>
  );
}
