'use client';

import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/shared/components/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMessages, sendMessage } from '../../chat/actions/chatActions';
import { syncChatSession } from './actions';

interface Message {
  id: string;
  text: string;
  isFromStore: boolean;
  createdAt: Date;
}

interface OrderChatSectionProps {
  businessName: string;
  businessId: string;
  buyerEmail: string;
  buyerName: string | null;
  buyerDni: string;
}

export default function OrderChatSection({
  businessName,
  businessId,
  buyerEmail,
  buyerName,
  buyerDni,
}: OrderChatSectionProps) {
  const supabase = useMemo(() => createClient(), []);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sincronización de Identidad y Sesión
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        const guestIdFromStorage = localStorage.getItem('chat_guest_id');
        const name = buyerName || buyerEmail.split('@')[0];

        const res = await syncChatSession({
          guestIdFromStorage,
          dni: buyerDni,
          businessId,
          buyerName: name,
        });

        if (res.success && res.sessionId) {
          setSessionId(res.sessionId);
          setGuestId(res.guestId!);
          localStorage.setItem('chat_guest_id', res.guestId!);
        }
      } catch (err) {
        console.error('[OrderChat] Sync failed:', err);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    initChat();
  }, [businessId, buyerDni, buyerEmail, buyerName]);

  // Carga de mensajes y suscripción Realtime
  useEffect(() => {
    if (!sessionId || !guestId) return;

    const loadMessages = async () => {
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
      }
    };
    loadMessages();

    const channel = supabase
      .channel(`chat-realtime-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          const m = payload.new;
          setMessages((prev) => {
            if (prev.find((item) => item.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                text: m.content,
                isFromStore: !!m.is_from_store,
                createdAt: m.created_at ? new Date(m.created_at) : new Date(),
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, guestId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || !sessionId || !guestId || isSending) return;

    setIsSending(true);
    setNewMessage('');
    try {
      await sendMessage({ sessionId, guestId, content: text });
    } catch (err) {
      console.error('[OrderChat] Send failed:', err);
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, sessionId, guestId, isSending]);

  if (isLoading) {
    return (
      <div className="chat-loading">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .chat-loading { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--md-sys-color-surface-container); border-radius: 32px; gap: 1rem; }
          .chat-spinner { width: 30px; height: 30px; border: 3px solid var(--md-sys-color-primary-container); border-top-color: var(--md-sys-color-primary); border-radius: 50%; animation: c-spin 0.8s linear infinite; }
          @keyframes c-spin { to { transform: rotate(360deg); } }
        `,
          }}
        />
        <div className="chat-spinner" />
        <p style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.5 }}>
          SINCRONIZANDO MENSAJES...
        </p>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .chat-wrapper { height: 100%; display: flex; flex-direction: column; background: var(--md-sys-color-surface-container-low); border-radius: 40px; border: 1px solid var(--md-sys-color-outline-variant); overflow: hidden; box-shadow: var(--md-sys-elevation-level1); }
        .chat-header { padding: 1.5rem; background: var(--md-sys-color-surface-container-high); border-bottom: 1px solid var(--md-sys-color-outline-variant); display: flex; align-items: center; gap: 1rem; }
        .chat-body { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; background: var(--md-sys-color-surface-container-low); }
        .msg-bubble { padding: 1rem 1.25rem; border-radius: 24px; font-size: 0.95rem; max-width: 85%; line-height: 1.5; position: relative; }
        .msg-store { background: var(--md-sys-color-surface-container-highest); color: var(--md-sys-color-on-surface); align-self: flex-start; border-bottom-left-radius: 4px; }
        .msg-user { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); align-self: flex-end; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(var(--md-sys-color-primary-rgb), 0.2); }
        .msg-time { display: block; font-size: 10px; margin-top: 4px; opacity: 0.5; font-weight: 700; }
        .msg-user .msg-time { color: var(--md-sys-color-on-primary); opacity: 0.7; }
        .chat-footer { padding: 1.25rem; background: var(--md-sys-color-surface-container-high); border-top: 1px solid var(--md-sys-color-outline-variant); }
        .input-bar { background: var(--md-sys-color-surface); border-radius: 100px; border: 2px solid var(--md-sys-color-outline-variant); display: flex; align-items: center; padding: 6px 6px 6px 1.5rem; gap: 0.5rem; transition: all 0.3s ease; }
        .input-bar:focus-within { border-color: var(--md-sys-color-primary); box-shadow: 0 0 0 4px rgba(var(--md-sys-color-primary-rgb), 0.1); }
        .input-bar input { flex: 1; border: none; background: transparent; outline: none; font-size: 0.95rem; height: 40px; color: var(--md-sys-color-on-surface); }
        .send-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--md-sys-color-primary); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .send-btn:hover { transform: scale(1.05); box-shadow: 0 5px 15px rgba(var(--md-sys-color-primary-rgb), 0.3); }
        .send-btn:disabled { opacity: 0.5; transform: none; }
      `,
        }}
      />

      <div className="chat-header">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '16px',
            background: 'var(--md-sys-color-tertiary-container)',
            color: 'var(--md-sys-color-on-tertiary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={28}>support_agent</Icon>
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 950, fontSize: '1rem', letterSpacing: '-0.02em' }}>Soporte de Tienda</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }} />
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#4CAF50', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conectado</span>
          </div>
        </div>
      </div>

      <div className="chat-body">
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.3 }}>
            <div style={{ background: 'var(--md-sys-color-surface-container-highest)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Icon size={40}>forum</Icon>
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 950, letterSpacing: '0.1em' }}>
              CHATEÁ CON EL VENDEDOR
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`msg-bubble ${m.isFromStore ? 'msg-store' : 'msg-user'}`}>
              {m.text}
              <span className="msg-time" style={{ textAlign: m.isFromStore ? 'left' : 'right' }}>
                {m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <div className="input-bar">
          <input
            type="text"
            placeholder="Escribí un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isSending}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
          >
            <Icon size={24}>{isSending ? 'hourglass_top' : 'send'}</Icon>
          </button>
        </div>
      </div>
    </div>
  );
}
