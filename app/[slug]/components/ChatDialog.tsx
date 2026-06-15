/* eslint-disable sonarjs/cognitive-complexity */

'use client';

import { useAuth } from '@/features/auth';
import {
  fetchMessages,
  getActiveChatSession,
  sendMessage,
  startChatSession,
} from '@/features/chat/actions/chatActions';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './ChatDialog.module.css';

const DEBUG_ABORTS = process.env.NEXT_PUBLIC_DEBUG_ABORTS === '1';

// Domain where the customer auth popup runs
// In dev: http://localhost:3000
// In prod: https://storelite.vercel.app (or your production domain)
// All store domains (store-girl.localhost, tienda1.com, etc.) open the
// popup to this central auth domain, which is the only URL Supabase needs.
const AUTH_ORIGIN =
  process.env.NEXT_PUBLIC_AUTH_ORIGIN ||
  (typeof window !== 'undefined' ? window.location.origin : '');

// ─── Message cache (localStorage) ──────────────────────────────────────────
const CACHE_PREFIX = 'chat_msg_cache_';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  messages: Message[];
  ts: number;
}

function getMessageCache(sessionId: string): Message[] | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${sessionId}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_PREFIX}${sessionId}`);
      return null;
    }
    // Re-hydrate Date objects
    return entry.messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
  } catch {
    return null;
  }
}

function setMessageCache(sessionId: string, messages: Message[]) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${sessionId}`,
      JSON.stringify({ messages, ts: Date.now() } satisfies CacheEntry),
    );
  } catch {
    // localStorage may be full or unavailable
  }
}

function clearMessageCache(sessionId?: string) {
  try {
    if (sessionId) {
      localStorage.removeItem(`${CACHE_PREFIX}${sessionId}`);
    } else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(CACHE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    // ignore
  }
}
// ────────────────────────────────────────────────────────────────────────────

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

interface ChatDialogProps {
  businessName: string;
  businessId: string;
  slug: string;
  businessLogo?: string | null;
  onClose: () => void;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDateLabel(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return 'Hoy';
  if (msgDate.getTime() === yesterday.getTime()) return 'Ayer';

  return date.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ChatDialog({
  businessName,
  businessId,
  slug,
  businessLogo,
  onClose,
}: ChatDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<'auth' | 'chat'>('auth');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('');
  const [isAwaitingAuth, setIsAwaitingAuth] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Tracks message IDs already confirmed by server response,
  // so Realtime handler can skip them and avoid duplicate races.
  const confirmedIdsRef = useRef<Set<string>>(new Set());

  // ─── Start or resume chat when user is authenticated ───
  useEffect(() => {
    if (authLoading || !user || isStarting || step === 'chat') return;

    const initChat = async () => {
      setIsStarting(true);
      try {
        const authGuestId = user.id;
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente';
        const email = user.email || '';
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

        setGuestName(name);
        setGuestEmail(email);
        setGuestAvatar(avatarUrl);

        // Check for existing active session
        const existing = await getActiveChatSession(authGuestId, businessId);
        if (existing.success && existing.session) {
          chatDialogDebug('initChat:resume', { sessionId: existing.session.id });
          setSessionId(existing.session.id);
          setStep('chat');
          return;
        }

        // Start new session with Google profile
        chatDialogDebug('initChat:start', { businessId, authGuestId: user.id });
        const result = await startChatSession({
          businessId,
          guestId: authGuestId,
          guestName: name,
          authUserId: user.id,
          guestEmail: email,
          guestAvatarUrl: avatarUrl,
        });

        if (result.success) {
          setSessionId(result.sessionId!);
          setStep('chat');
        } else {
          console.error('Error starting chat session:', result.error);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsStarting(false);
      }
    };

    initChat();

    // guard values set BY this effect, not reactive inputs. Including them causes
    // the effect to re-run 2-3x during init instead of once.
  }, [user, authLoading, businessId]);

  // ─── Fetch messages when session is ready (with cache) ───
  useEffect(() => {
    if (sessionId) {
      chatDialogDebug('messagesEffect:start', { sessionId });

      // 1. Try loading from localStorage cache first (instant)
      const cached = getMessageCache(sessionId);
      if (cached) {
        chatDialogDebug('messagesEffect:cache-hit', { sessionId, count: cached.length });
        setMessages(cached);
      }

      // 2. Always fetch from DB in the background (stale-while-revalidate)
      const loadMessages = async () => {
        chatDialogDebug('loadMessages:start', { sessionId });
        // Only show skeleton if we have NO cached data
        const needsSkeleton = !cached;
        if (needsSkeleton) setIsLoadingMessages(true);

        const result = await fetchMessages(sessionId);
        if (result.success && result.messages) {
          const msgs = result.messages.map((m) => ({
            id: m.id,
            text: m.content,
            isFromStore: !!m.isFromStore,
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          }));
          setMessages(msgs);
          // Update cache with fresh data
          setMessageCache(sessionId, msgs);
          chatDialogDebug('loadMessages:success', { sessionId, count: result.messages.length });
        }
        setIsLoadingMessages(false);
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
          (
            payload: RealtimePostgresInsertPayload<{
              id: string;
              session_id: string;
              content: string;
              is_from_store: boolean | null;
              created_at: string | null;
            }>,
          ) => {
            const newMsg = payload.new;
            chatDialogDebug('channel:insert', {
              sessionId: String(newMsg.session_id),
              messageId: String(newMsg.id),
            });

            // Skip messages we already confirmed via server response
            if (confirmedIdsRef.current.has(newMsg.id)) {
              chatDialogDebug('channel:skip-confirmed', { messageId: String(newMsg.id) });
              return;
            }

            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;

              const m: Message = {
                id: newMsg.id,
                text: newMsg.content,
                isFromStore: !!newMsg.is_from_store,
                createdAt: newMsg.created_at ? new Date(newMsg.created_at) : new Date(),
              };
              return [...prev, m];
            });
          },
        )
        .subscribe((status: string) => {
          chatDialogDebug('channel:status', { sessionId, status });
        });

      return () => {
        chatDialogDebug('messagesEffect:cleanup', { sessionId });
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId, supabase]);

  // ─── Sync messages to cache whenever they change (realtime included) ───
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      setMessageCache(sessionId, messages);
    }
  }, [messages, sessionId]);

  // ─── Polling fallback: fetch messages every 8s as safety net when Realtime fails ───
  useEffect(() => {
    if (!sessionId || step !== 'chat') return;

    const pollMessages = async () => {
      const result = await fetchMessages(sessionId);
      if (!result.success || !result.messages) return;

      setMessages((prev) => {
        // Map DB results to our Message type
        const dbMsgs: Message[] = result.messages!.map((m) => ({
          id: m.id,
          text: m.content,
          isFromStore: !!m.isFromStore,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        }));
        const dbIds = new Set(dbMsgs.map((m) => m.id));

        // Keep pending temp messages that haven't been confirmed in DB yet
        const pendingTemps = prev.filter((m) => {
          if (!m.id.startsWith('temp-')) return false;
          // If a DB message has the same text within 5s, the temp is obsolete
          return !dbMsgs.some(
            (db) =>
              db.text === m.text && Math.abs(db.createdAt.getTime() - m.createdAt.getTime()) < 5000,
          );
        });

        // Merge DB messages + pending temps, dedup by ID, sort by time
        const merged = [...dbMsgs, ...pendingTemps];
        const seen = new Set<string>();
        const deduped = merged.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        deduped.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        // Only update if something actually changed
        if (
          deduped.length === prev.length &&
          deduped.every((m, i) => m.id === prev[i].id && m.text === prev[i].text)
        ) {
          return prev;
        }
        return deduped;
      });
    };

    const intervalId = setInterval(pollMessages, 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId, step]);

  // ─── Scroll to bottom ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Focus input when chat opens ───
  useEffect(() => {
    if (step === 'chat') {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // ─── Send message ───
  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || !sessionId || isSending) return;

    setIsSending(true);
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
        guestId: user?.id || '',
        content: text,
      });

      if (result.success && result.message) {
        const realId = result.message.id;
        // Register this ID so the Realtime handler skips it
        confirmedIdsRef.current.add(realId);
        setTimeout(() => confirmedIdsRef.current.delete(realId), 2000);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  id: realId,
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
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setNewMessage(text);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, sessionId, isSending, user]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Listen for auth tokens from popup ───
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Only accept messages from the auth domain
      if (event.origin !== AUTH_ORIGIN) return;

      if (event.data?.type === 'AUTH_SUCCESS' && event.data?.slug === slug) {
        console.info('[ChatDialog] Auth tokens received from popup');
        setIsAwaitingAuth(false);
        supabase.auth
          .setSession({
            access_token: event.data.access_token,
            refresh_token: event.data.refresh_token,
          })
          .catch((err: Error) => {
            console.error('[ChatDialog] Error setting session:', err);
          });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [slug, supabase]);

  // ─── Sign out from chat ───
  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearMessageCache(sessionId ?? undefined);
      setStep('auth');
      setSessionId(null);
      setMessages([]);
      setGuestName('');
      setGuestEmail('');
      setGuestAvatar('');
      setIsLoadingMessages(false);
    } catch (error) {
      console.error('[ChatDialog] Error signing out:', error);
    }
  }, [supabase, sessionId]);

  const handleGoogleSignIn = () => {
    // Open a popup to the CENTRAL AUTH DOMAIN, not the current store domain.
    // The popup shows ONLY the store branding (name + logo), no SaaS pages.
    const popupUrl = new URL(`${AUTH_ORIGIN}/auth/customer`);
    popupUrl.searchParams.set('slug', slug);
    popupUrl.searchParams.set('name', businessName);
    if (businessLogo) popupUrl.searchParams.set('logo', businessLogo);
    popupUrl.searchParams.set('origin', window.location.origin);

    const popup = window.open(popupUrl.toString(), 'customer-auth', 'width=600,height=700,popup=1');

    if (!popup || popup.closed) {
      console.warn('[ChatDialog] Popup was blocked');
      return;
    }

    setIsAwaitingAuth(true);

    // Poll for popup closure — if user closes without auth, reset state
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsAwaitingAuth(false);
      }
    }, 500);
  };

  return (
    <div className={styles.dialog} role="dialog" aria-label="Chat con la tienda">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>
          {businessLogo ? (
            <Image
              src={businessLogo}
              alt={businessName}
              className={styles.businessLogo}
              width={44}
              height={44}
            />
          ) : (
            <span className="material-symbols-outlined">store</span>
          )}
        </div>
        <div className={styles.headerText}>
          <p className={styles.headerTitle}>{businessName}</p>
          <p className={styles.headerSubtitle}>
            {authLoading || isStarting || isAwaitingAuth
              ? 'Cargando...'
              : step === 'chat'
                ? 'En línea'
                : 'Identifícate para chatear'}
          </p>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar chat">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {authLoading || isStarting || isAwaitingAuth ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>
              {isAwaitingAuth
                ? 'Esperando autenticación con Google…'
                : authLoading
                  ? 'Verificando sesión…'
                  : isStarting
                    ? 'Conectando con la tienda…'
                    : 'Cargando…'}
            </p>
          </div>
        ) : step === 'chat' ? (
          <div className={styles.chatWindow}>
            <div className={styles.userBar}>
              <div className={styles.userBarAvatar}>
                {guestAvatar ? (
                  <Image
                    src={guestAvatar}
                    alt=""
                    className={styles.userBarAvatarImg}
                    width={36}
                    height={36}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="material-symbols-outlined">person</span>
                )}
              </div>
              <div className={styles.userBarInfo}>
                <p className={styles.userBarName}>{guestName}</p>
                <p className={styles.userBarEmail}>{guestEmail}</p>
              </div>
              <button
                className={styles.userBarSignOut}
                onClick={handleSignOut}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
            <div className={styles.messages}>
              {isLoadingMessages ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`${styles.skeletonBubble} ${
                      i % 2 === 0 ? styles.skeletonBubbleStore : styles.skeletonBubbleUser
                    }`}
                  >
                    <div className={styles.skeletonLine} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>chat_bubble</span>
                  <span>Escríbenos, estamos aquí para ayudarte</span>
                </div>
              ) : (
                (() => {
                  let lastDate: string | null = null;
                  return messages.map((msg) => {
                    const msgDateLabel = getDateLabel(msg.createdAt);
                    const showDate = msgDateLabel !== lastDate;
                    lastDate = msgDateLabel;
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className={styles.dateSeparator}>
                            <span>{msgDateLabel}</span>
                          </div>
                        )}
                        <div
                          className={`${styles.bubble} ${
                            msg.isFromStore ? styles.bubbleStore : styles.bubbleUser
                          }`}
                        >
                          {msg.text}
                          <span
                            className={`${styles.bubbleTime} ${
                              msg.isFromStore ? styles.bubbleTimeStore : styles.bubbleTimeUser
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()
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
          /* step === 'auth' */
          <div className={styles.stepIntro}>
            <div className={styles.authAvatar}>
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
                forum
              </span>
            </div>
            <p className={styles.stepTitle}>Chatea con {businessName}</p>
            <p className={styles.stepDescription}>
              Identifícate con tu cuenta de Google para empezar a conversar. Solo compartiremos tu
              nombre, correo y foto de perfil con la tienda.
            </p>

            <button className={styles.googleButton} onClick={handleGoogleSignIn}>
              <svg viewBox="0 0 24 24" width="20" height="20" className={styles.googleIcon}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
