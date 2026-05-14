import { Icon } from '@/shared/components/ui';
import { IconButton } from '@/shared/components/ui/buttons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Chat, Message } from './ChatClient';
import styles from './ChatWindow.module.css';

/** Regex para detectar URLs en texto — soporta http/https y www. */
const URL_REGEX = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+\.[^\s<]+)/gi;

/**
 * Renderiza texto de mensaje con URLs convertidas a <a> clickeables.
 * Separa el texto por URLs, y cada segmento que matchea lo envuelve en un link.
 */
function renderMessageText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state (important because of the `g` flag)
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    // Texto antes de la URL
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const rawUrl = match[0];
    // Si arranca con www, agregamos https://
    const href = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    nodes.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.messageLink}
        onClick={(e) => e.stopPropagation()}
      >
        {rawUrl}
      </a>,
    );

    lastIndex = match.index + rawUrl.length;
  }

  // Texto restante después de la última URL
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function isSameDay(a: Date, b: Date): boolean {
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysBetween(from: Date, to: Date): number {
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const t = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((t.getTime() - f.getTime()) / 86400000);
}

function formatDateLabel(date: Date): string {
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diff = daysBetween(date, now);

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';

  if (diff < 7) {
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dayNames[date.getDay()];
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${padTwo(date.getDate())}/${padTwo(date.getMonth() + 1)}`;
  }

  return `${padTwo(date.getDate())}/${padTwo(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
}

interface ChatWindowProps {
  session: Chat | null;
  messages: Message[];
  storeName: string;
  storeDescription: string;
  onSendMessage: (text: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onDeleteChat: () => void;
  onShareChat: () => void;
  isShareConfirmed: boolean;
  onBack?: () => void;
  slug: string;
  isLoading?: boolean;
}

export function ChatWindow({
  session,
  messages,
  storeName,
  storeDescription,
  onSendMessage,
  searchQuery,
  onSearchChange,
  onDeleteChat,
  onBack,
  slug,
  isLoading = false,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus search input when search becomes visible
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  // Calculate delete availability — useMemo to avoid Date.now() during render
  const deleteButton = useMemo(() => {
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const daysSinceLastMsg = lastMsg
      ? Math.floor((now - new Date(lastMsg.createdAt).getTime()) / 86400000)
      : 0;
    const canDelete = daysSinceLastMsg >= 30;
    const tooltipMsg = canDelete
      ? 'Eliminar chat'
      : `No se puede eliminar hasta 30 días después del último mensaje (${30 - daysSinceLastMsg} días restantes)`;

    return (
      <div className={styles.tooltipWrap} data-tooltip={tooltipMsg}>
        <IconButton
          variant="standard"
          aria-label="Eliminar chat"
          disabled={!canDelete}
          onClick={canDelete ? onDeleteChat : undefined}
        >
          <Icon>delete</Icon>
        </IconButton>
      </div>
    );
  }, [messages, onDeleteChat, now]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const openSearchBar = () => {
    setIsSearchVisible(true);
  };

  const closeSearchBar = () => {
    setIsSearchVisible(false);
    onSearchChange('');
  };

  // ─── Empty state ───
  if (!session) {
    return (
      <main className={styles.chatWindow}>
        {/* Mobile Mini Header for empty state */}
        <header className={`${styles.header} ${styles.mobileOnly}`}>
          <div className={styles.userDetails}>
            <h3 className={styles.userName}>Mensajes</h3>
          </div>
        </header>

        <div className={styles.emptyState}>
          <div className={styles.emptyLogo}>
            <Icon size={48}>forum</Icon>
          </div>
          <h2 className={styles.emptyStoreName}>{storeName}</h2>
          <p className={styles.emptyStoreDescription}>{storeDescription}</p>
          <div className={styles.emptyBrandingWrapper}>
            <div className={styles.emptyPlatform}>
              <span className={styles.platformDot} />
              store.lite • {slug}
            </div>
            <p className={styles.emptySubTitle}>Vende más, chatea mejor</p>
          </div>
        </div>
      </main>
    );
  }

  // ─── Loading state ───
  if (isLoading) {
    return (
      <main className={styles.chatWindow}>
        <header className={styles.header}>
          <div className={styles.userInfo}>
            {onBack && (
              <IconButton variant="standard" aria-label="Volver" onClick={onBack}>
                <Icon>arrow_back</Icon>
              </IconButton>
            )}
            <div className={styles.avatarContainer}>
              <div className={styles.skeletonAvatar} />
            </div>
            <div className={styles.userDetails}>
              <div className={styles.skeletonName} />
              <div className={styles.skeletonStatus} />
            </div>
          </div>
        </header>
        <div className={styles.messagesArea}>
          <div className={styles.skeletonMessages}>
            <div className={`${styles.skeletonRow} ${styles.skeletonRowThem}`}>
              <div className={`${styles.skeletonBubble} ${styles.skeletonBubbleThem1}`} />
            </div>
            <div className={`${styles.skeletonRow} ${styles.skeletonRowMe}`}>
              <div className={`${styles.skeletonBubble} ${styles.skeletonBubbleMe1}`} />
            </div>
            <div className={`${styles.skeletonRow} ${styles.skeletonRowThem}`}>
              <div className={`${styles.skeletonBubble} ${styles.skeletonBubbleThem2}`} />
            </div>
            <div className={`${styles.skeletonRow} ${styles.skeletonRowMe}`}>
              <div className={`${styles.skeletonBubble} ${styles.skeletonBubbleMe2}`} />
            </div>
            <div className={`${styles.skeletonRow} ${styles.skeletonRowMe}`}>
              <div className={`${styles.skeletonBubble} ${styles.skeletonBubbleMe3}`} />
            </div>
          </div>
        </div>
        <footer className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <div className={styles.skeletonInput} />
          </div>
        </footer>
      </main>
    );
  }

  // ─── Filter messages by search ───
  const filteredMessages = searchQuery
    ? messages.filter((msg) => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <main className={styles.chatWindow}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.userInfo}>
          {onBack && (
            <IconButton
              variant="standard"
              aria-label="Volver"
              onClick={onBack}
              className={styles.backButton}
            >
              <Icon>arrow_back</Icon>
            </IconButton>
          )}
          <div className={styles.avatarContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.avatarUrl}
              alt={session.name}
              width={40}
              height={40}
              className={styles.avatar}
            />
            {session.online && <span className={styles.onlineBadge} />}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userNameRow}>
              <h3 className={styles.userName}>{session.name}</h3>
              {session.isOrderChat && (
                <span className={styles.orderBadge}>
                  {session.orderNumber ? `#${session.orderNumber}` : 'Orden'}
                </span>
              )}
              {session.isGoogleAuth && (
                <span className={styles.verifiedBadge} title="Verificado con Google">
                  <Icon size={14}>verified</Icon>
                </span>
              )}
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userEmail}>{session.email || 'Sin correo'}</span>
              <span className={styles.userDot}>·</span>
              <span className={styles.userStatus}>
                {session.online ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Responsive Header Actions with Sliding Search */}
        <div className={styles.headerRight}>
          <div
            className={`${styles.searchContainer} ${isSearchVisible ? styles.searchVisible : ''}`}
          >
            <div className={styles.searchBar}>
              <Icon size={20}>search</Icon>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar en este chat..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <IconButton
                  variant="standard"
                  aria-label="Limpiar búsqueda"
                  onClick={() => onSearchChange('')}
                >
                  <Icon size={18}>close</Icon>
                </IconButton>
              )}
              <IconButton variant="standard" aria-label="Cerrar búsqueda" onClick={closeSearchBar}>
                <Icon size={20}>arrow_forward</Icon>
              </IconButton>
            </div>
          </div>

          <div className={`${styles.headerActions} ${isSearchVisible ? styles.actionsHidden : ''}`}>
            <IconButton variant="standard" aria-label="Buscar en chat" onClick={openSearchBar}>
              <Icon>search</Icon>
            </IconButton>
            {deleteButton}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {filteredMessages.map((msg, index) => {
          const showDateSeparator =
            msg.createdAt &&
            (index === 0 ||
              !isSameDay(new Date(filteredMessages[index - 1].createdAt), new Date(msg.createdAt)));

          const isMe = msg.sender === 'me';
          const isImage = !!msg.imageUrl;

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && (
                <div className={styles.dateSeparator}>
                  <span className={styles.dateText}>
                    {formatDateLabel(new Date(msg.createdAt))}
                  </span>
                </div>
              )}
              <div
                className={`${styles.messageRow} ${isMe ? styles.messageRowMe : styles.messageRowThem}`}
              >
                {!isMe && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.avatarUrl}
                    alt={session.name}
                    className={styles.messageAvatar}
                  />
                )}

                {isImage ? (
                  <div
                    className={`${styles.imageBubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}
                  >
                    <div className={styles.imageWrapper}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageUrl}
                        alt="Imagen compartida"
                        className={styles.messageImage}
                      />
                    </div>
                    <div className={styles.imageTimeOverlay}>
                      <span>{msg.time}</span>
                      {isMe && <Icon size={14}>done_all</Icon>}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`${styles.messageBubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}
                  >
                    <p className={styles.messageText}>{renderMessageText(msg.text)}</p>
                    <div
                      className={`${styles.messageTime} ${isMe ? styles.timeMe : styles.timeThem}`}
                    >
                      {msg.time}
                      {isMe && (
                        <Icon size={14} className={styles.readIcon}>
                          done_all
                        </Icon>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {filteredMessages.length === 0 && (
          <div className={styles.noResults}>No hay mensajes coincidentes</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            className={styles.textInput}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <IconButton
            variant="filled"
            aria-label="Enviar mensaje"
            disabled={!inputText.trim()}
            onClick={handleSend}
            style={
              {
                '--md-icon-button-container-color': 'var(--md-sys-color-primary, #135bec)',
                '--md-icon-button-icon-color': 'var(--md-sys-color-on-primary, #ffffff)',
                marginLeft: '8px',
                opacity: !inputText.trim() ? 0.5 : 1,
              } as React.CSSProperties
            }
          >
            <Icon>send</Icon>
          </IconButton>
        </div>
      </footer>
    </main>
  );
}
