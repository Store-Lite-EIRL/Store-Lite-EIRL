/* eslint-disable sonarjs/cognitive-complexity */

'use client';

import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchMessages,
  getActiveChatSession,
  sendMessage,
  startChatSession,
} from '../chat/actions/chatActions';
import styles from './ChatDialog.module.css';
import Checkout from './Checkout';

const DEBUG_ABORTS = process.env.NEXT_PUBLIC_DEBUG_ABORTS === '1';

function chatDialogDebug(message: string, payload?: Record<string, unknown>) {
  if (!DEBUG_ABORTS) return;
  console.warn('[ChatDialogDebug]', message, payload ?? {});
}

interface Message {
  id: string;
  text: string;
  isFromStore: boolean;
  createdAt: Date;
}

interface GuestInfo {
  name: string;
  gender: 'male' | 'female';
}

interface ChatDialogProps {
  businessName: string;
  businessId: string;
  businessLogo?: string | null;
  onClose: () => void;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function ChatDialog({ businessName, businessId, businessLogo, onClose }: ChatDialogProps) {
  const supabase = useMemo(() => createClient(), []);
  const [guestId, setGuestId] = useState<string>('');
  const [step, setStep] = useState<'intro-name' | 'intro-gender' | 'chat'>('intro-name');
  const [guest, setGuest] = useState<{ name: string; gender: 'male' | 'female' }>({
    name: '',
    gender: 'male',
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or retrieve Guest ID and Session
  useEffect(() => {
    let storedGuestId = localStorage.getItem('chat_guest_id');
    if (!storedGuestId) {
      storedGuestId = `g-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('chat_guest_id', storedGuestId);
    }
    setGuestId(storedGuestId);

    // Check if there's a stored session or guest info to skip intro if desired
    const checkActiveSession = async (gId: string) => {
      try {
        chatDialogDebug('checkActiveSession:start', { businessId, guestId: gId });
        const result = await getActiveChatSession(gId, businessId);
        if (result.success && result.session) {
          chatDialogDebug('checkActiveSession:found', { sessionId: result.session.id });
          setSessionId(result.session.id);
          setGuest({
            name: result.session.guestName,
            gender: result.session.guestGender as 'male' | 'female',
          });
          setStep('chat');
        } else {
          chatDialogDebug('checkActiveSession:none');
          // Fallback to local storage for guest info if no session but name exists
          const storedName = localStorage.getItem('chat_guest_name');
          const storedGender = localStorage.getItem('chat_guest_gender') as
            | 'male'
            | 'female'
            | null;
          if (storedName && storedGender) {
            setGuest({ name: storedName, gender: storedGender });
            setStep('intro-gender'); // If we have name but no session, maybe ask gender or just go to chat
          } else {
            setStep('intro-name');
          }
        }
      } finally {
        setIsLoadingSession(false);
        chatDialogDebug('checkActiveSession:done');
      }
    };

    checkActiveSession(storedGuestId);
  }, [businessId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages if sessionId exists and setup real-time
  useEffect(() => {
    if (sessionId) {
      chatDialogDebug('messagesEffect:start', { sessionId });
      const loadMessages = async () => {
        chatDialogDebug('loadMessages:start', { sessionId });
        const result = await fetchMessages(sessionId, guestId);
        if (result.success && result.messages) {
          setMessages(
            result.messages.map((m) => ({
              id: m.id,
              text: m.content,
              isFromStore: !!m.isFromStore,
              createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            })),
          );
          setStep('chat');
          chatDialogDebug('loadMessages:success', { sessionId, count: result.messages.length });
        }
      };

      loadMessages();

      // Real-time subscription
      const channel = supabase
        .channel(`session-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload: any) => {
            const newMessage = payload.new;
            chatDialogDebug('channel:insert', {
              sessionId: String(newMessage.session_id),
              messageId: String(newMessage.id),
            });
            setMessages((prev) => {
              // Avoid duplicate if it was already added optimistically
              if (prev.find((m) => m.id === newMessage.id)) return prev;

              const m: Message = {
                id: newMessage.id,
                text: newMessage.content,
                isFromStore: !!newMessage.is_from_store,
                createdAt: newMessage.created_at ? new Date(newMessage.created_at) : new Date(),
              };
              return [...prev, m];
            });
          },
        )
        .subscribe();

      return () => {
        chatDialogDebug('messagesEffect:cleanup', { sessionId });
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId, supabase, guestId]);

  // Focus input when chat opens
  useEffect(() => {
    if (step === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleStartChat = async () => {
    if (!guest.name.trim() || isStarting) return;

    setIsStarting(true);
    try {
      const guestId = localStorage.getItem('chat_guest_id') || '';

      const result = await startChatSession({
        businessId,
        guestId,
        guestName: guest.name,
        guestGender: guest.gender,
      });

      if (result.success) {
        setSessionId(result.sessionId!);
        localStorage.setItem('chat_guest_name', guest.name);
        localStorage.setItem('chat_guest_gender', guest.gender);

        setStep('chat');
        setMessages([
          {
            id: 'welcome',
            text: `¡Hola ${guest.name}! 👋 Bienvenido/a a ${businessName}. ¿En qué podemos ayudarte?`,
            isFromStore: true,
            createdAt: new Date(),
          },
        ]);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Ocurrió un error al intentar iniciar el chat.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || !sessionId || isSending) return;

    setIsSending(true);
    // Add local optimistic message
    const tempId = `temp-${Date.now()}`;
    const userMsg: Message = {
      id: tempId,
      text,
      isFromStore: false,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');

    try {
      const result = await sendMessage({
        sessionId,
        guestId,
        content: text,
      });

      if (result.success && result.message) {
        // Update the temporary message with the real one from DB
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  id: result.message!.id,
                  text: result.message!.content,
                  isFromStore: !!result.message!.isFromStore,
                  createdAt: result.message!.createdAt
                    ? new Date(result.message!.createdAt)
                    : new Date(),
                }
              : m,
          ),
        );
      } else {
        console.error('Error sending message:', result.error);
        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        // Optionally restore the text to the input so user can try again
        setNewMessage(text);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, sessionId, isSending, guestId]);

  const handlePaymentSuccess = useCallback(async () => {
    setIsCheckoutOpen(false);

    if (!sessionId) return;

    const alertMsg = '✅ Pago completado con éxito. En breve un asesor confirmará tu pedido.';

    // Optimistic message
    const tempId = `temp-pay-${Date.now()}`;
    const userMsg: Message = {
      id: tempId,
      text: alertMsg,
      isFromStore: false,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await sendMessage({
        sessionId,
        guestId,
        content: alertMsg,
      });

      if (result.success && result.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  id: result.message!.id,
                  text: result.message!.content,
                  isFromStore: !!result.message!.isFromStore,
                  createdAt: result.message!.createdAt
                    ? new Date(result.message!.createdAt)
                    : new Date(),
                }
              : m,
          ),
        );
      }
    } catch (error) {
      console.error('Error recording payment success message:', error);
    }
  }, [sessionId, guestId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.dialog} role="dialog" aria-label="Chat con la tienda">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>
          {businessLogo ? (
            <img src={businessLogo} alt={businessName} className={styles.businessLogo} />
          ) : (
            <span className="material-symbols-outlined">store</span>
          )}
        </div>
        <div className={styles.headerText}>
          <p className={styles.headerTitle}>{businessName}</p>
          <p className={styles.headerSubtitle}>
            {isLoadingSession
              ? 'Cargando...'
              : step === 'chat'
                ? `En línea`
                : 'Paso ' + (step === 'intro-name' ? '1/2' : '2/2')}
          </p>
        </div>
        {step === 'chat' && (
          <button
            className={styles.payHeaderBtn}
            onClick={() => setIsCheckoutOpen(true)}
            aria-label="Pagar"
          >
            <span className="material-symbols-outlined">credit_card</span>
            <span className={styles.payHeaderBtnText}>Pagar</span>
          </button>
        )}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar chat">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isLoadingSession ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Cargando chat...</p>
          </div>
        ) : step === 'chat' ? (
          <div className={styles.chatWindow}>
            <div className={styles.messages}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>chat_bubble</span>
                  <span>Escríbenos, estamos aquí para ayudarte</span>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id}>
                    <div
                      className={`${styles.bubble} ${
                        msg.isFromStore ? styles.bubbleStore : styles.bubbleUser
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div
                      className={styles.bubbleTime}
                      style={{ textAlign: msg.isFromStore ? 'left' : 'right' }}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <textarea
                ref={inputRef}
                className={styles.messageInput}
                rows={1}
                placeholder="Escribe un mensaje…"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                disabled={isSending}
                autoFocus
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending}
                aria-label="Enviar mensaje"
              >
                send
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.stepIntro}>
            {step === 'intro-name' ? (
              <>
                <p className={styles.stepTitle}>
                  Antes de chatear, dinos cómo te llamas para poder atenderte mejor.
                </p>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="chat-name">
                    Tu nombre
                  </label>
                  <input
                    id="chat-name"
                    type="text"
                    placeholder="Escribe tu nombre..."
                    value={guest.name}
                    onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                    className={styles.input}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && guest.name.trim() && setStep('intro-gender')
                    }
                    autoFocus
                    maxLength={60}
                  />
                </div>
                <button
                  className={styles.startBtn}
                  onClick={() => guest.name.trim() && setStep('intro-gender')}
                  disabled={!guest.name.trim()}
                >
                  Siguiente
                </button>
              </>
            ) : (
              // step === 'intro-gender'
              <>
                <p className={styles.stepTitle}>¡Hola {guest.name}! ¿Cuál es tu género?</p>
                <div className={styles.formGroup}>
                  <div className={styles.genderGroup}>
                    <button
                      type="button"
                      className={`${styles.genderOption} ${guest.gender === 'male' ? styles.genderOptionSelected : ''}`}
                      onClick={() => setGuest((g) => ({ ...g, gender: 'male' }))}
                      aria-pressed={guest.gender === 'male' ? 'true' : 'false'}
                    >
                      <span className={styles.genderIcon}>man</span>
                      Hombre
                    </button>
                    <button
                      type="button"
                      className={`${styles.genderOption} ${guest.gender === 'female' ? styles.genderOptionSelected : ''}`}
                      onClick={() => setGuest((g) => ({ ...g, gender: 'female' }))}
                      aria-pressed={guest.gender === 'female' ? 'true' : 'false'}
                    >
                      <span className={styles.genderIcon}>woman</span>
                      Mujer
                    </button>
                  </div>
                </div>
                <div className={styles.buttonRow}>
                  <button className={styles.backBtn} onClick={() => setStep('intro-name')}>
                    <Icon size={25}>arrow_back</Icon>
                  </button>
                  <button
                    className={styles.startBtn}
                    onClick={handleStartChat}
                    disabled={isStarting}
                  >
                    {isStarting ? 'Iniciando...' : 'Iniciar chat'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <Checkout
          totalAmount={99.9} // Mock value for demo purposes
          cartItems={[]} // Empty cart for quick pay demo
          onSuccess={handlePaymentSuccess}
          onCancel={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
