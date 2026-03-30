/* eslint-disable max-lines-per-function */
import { CircularProgress, Icon } from '@/shared/components/ui';
import { IconButton } from '@/shared/components/ui/buttons';
import React, { useEffect, useRef, useState } from 'react';
import type { Chat, Message } from './ChatClient';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  session: Chat | null;
  messages: Message[];
  storeName: string;
  storeDescription: string;
  onSendMessage: (text: string) => void;
  onSendImage: (imageUrl: string) => void;
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
  onSendImage,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus search input when search becomes visible
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      onSendImage(url);
    }
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              <div className={styles.avatarPlaceholder} />
            </div>
            <div className={styles.userDetails}>
              <h3 className={styles.userName}>Cargando...</h3>
            </div>
          </div>
        </header>
        <div className={styles.loadingArea}>
          <CircularProgress indeterminate />
        </div>
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
            <h3 className={styles.userName}>{session.name}</h3>
            <span className={styles.userStatus}>
              {session.online ? 'En línea' : 'Desconectado'}
            </span>
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
            <IconButton variant="standard" aria-label="Eliminar chat" onClick={onDeleteChat}>
              <Icon>delete</Icon>
            </IconButton>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className={styles.messagesArea}>
        <div className={styles.dateSeparator}>
          <span className={styles.dateText}>Hoy</span>
        </div>

        {filteredMessages.map((msg) => {
          const isMe = msg.sender === 'me';
          const isImage = !!msg.imageUrl;

          return (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${isMe ? styles.messageRowMe : styles.messageRowThem}`}
            >
              {!isMe && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.avatarUrl} alt={session.name} className={styles.messageAvatar} />
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
                  <p className={styles.messageText}>{msg.text}</p>
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
          );
        })}

        {filteredMessages.length === 0 && (
          <div className={styles.noResults}>No hay mensajes coincidentes</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="Seleccionar imagen"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Input Area */}
      <footer className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <IconButton
            variant="standard"
            aria-label="Adjuntar imagen"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon>image</Icon>
          </IconButton>

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
            onClick={handleSend}
            style={
              {
                '--md-icon-button-container-color': 'var(--md-sys-color-primary, #135bec)',
                '--md-icon-button-icon-color': 'var(--md-sys-color-on-primary, #ffffff)',
                marginLeft: '8px',
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
