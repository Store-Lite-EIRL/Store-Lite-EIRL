'use client';

import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { useEffect, useState } from 'react';
import styles from '../messages.module.css';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { DeleteChatDialog } from './DeleteChatDialog';

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
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
  chatId: string;
  imageUrl?: string;
}

const INITIAL_CHATS: Chat[] = [
  {
    id: '1',
    name: 'Ana Martínez',
    preview: '¿El producto tiene garantía?',
    time: '10:42 AM',
    unread: 2,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=a',
  },
  {
    id: '2',
    name: 'Carlos Santos',
    preview: 'Me interesa la laptop gamer.',
    time: 'Ayer',
    unread: 0,
    online: false,
    avatarUrl: 'https://i.pravatar.cc/150?u=b',
  },
  {
    id: '3',
    name: 'Soporte Técnico',
    preview: 'Tu ticket ha sido resuelto.',
    time: 'Mar 12',
    unread: 1,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=c',
  },
  {
    id: '4',
    name: 'Juan Perez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=d',
  },
  {
    id: '5',
    name: 'Maria Lopez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=e',
  },
  {
    id: '6',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=f',
  },
  {
    id: '7',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=g',
  },
  {
    id: '8',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=h',
  },
  {
    id: '9',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=i',
  },
  {
    id: '10',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=j',
  },
  {
    id: '11',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=k',
  },
  {
    id: '12',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=l',
  },
  {
    id: '13',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=m',
  },
  {
    id: '14',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=n',
  },
  {
    id: '15',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=o',
  },
  {
    id: '16',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=p',
  },
  {
    id: '17',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=q',
  },
  {
    id: '18',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=r',
  },
  {
    id: '19',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=s',
  },
  {
    id: '20',
    name: 'Pedro Rodriguez',
    preview: 'Hola, ¿tienes disponibilidad?',
    time: '10:42 AM',
    unread: 0,
    online: true,
    avatarUrl: 'https://i.pravatar.cc/150?u=t',
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: '¡Hola! ¿Tienen disponible este modelo en color negro?',
    sender: 'them',
    time: '10:30 AM',
    chatId: '1',
  },
  {
    id: 2,
    text: '¡Hola Ana! Sí, tenemos disponibilidad inmediata en color negro.',
    sender: 'me',
    time: '10:32 AM',
    chatId: '1',
  },
  {
    id: 3,
    text: 'Excelente. ¿El envío tiene algún costo adicional a Bogotá?',
    sender: 'them',
    time: '10:35 AM',
    chatId: '1',
  },
  {
    id: 4,
    text: 'El envío es totalmente gratis por compras superiores a $150.000.',
    sender: 'me',
    time: '10:38 AM',
    chatId: '1',
  },
  {
    id: 5,
    text: 'Perfecto, voy a realizar la compra. ¿Tienen pago contra entrega?',
    sender: 'them',
    time: '10:40 AM',
    chatId: '1',
  },
  {
    id: 6,
    text: 'No manejamos pago contra entrega por el momento, pero aceptamos todas las tarjetas, PSE y Nequi a través de nuestra pasarela segura.',
    sender: 'me',
    time: '10:41 AM',
    chatId: '1',
  },
  {
    id: 7,
    text: 'Entiendo. ¿El producto tiene garantía?',
    sender: 'them',
    time: '10:42 AM',
    chatId: '1',
  },

  {
    id: 8,
    text: 'Hola, vi la laptop gamer en su catálogo. ¿Sigue disponible?',
    sender: 'them',
    time: 'Ayer',
    chatId: '2',
  },
  {
    id: 9,
    text: '¡Hola Carlos! Sí, aún nos quedan un par de unidades. ¡Anímate!',
    sender: 'me',
    time: 'Ayer',
    chatId: '2',
  },
  {
    id: 10,
    text: 'Me interesa la laptop gamer.',
    sender: 'them',
    time: 'Ayer',
    chatId: '2',
  },

  {
    id: 11,
    text: '¡Hola! Tengo un problema con mi compra #12345.',
    sender: 'me',
    time: 'Mar 12',
    chatId: '3',
  },
  {
    id: 12,
    text: 'Revisaremos tu caso a la brevedad.',
    sender: 'them',
    time: 'Mar 12',
    chatId: '3',
  },
  {
    id: 13,
    text: 'Tu ticket ha sido resuelto.',
    sender: 'them',
    time: 'Mar 12',
    chatId: '3',
  },

  // Messages with images
  {
    id: 14,
    text: 'Mira el nuevo diseño de la tienda.',
    sender: 'me',
    time: '11:00 AM',
    chatId: '1',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  },
  {
    id: 15,
    text: '¿Qué te parece este color?',
    sender: 'them',
    time: '11:05 AM',
    chatId: '1',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  },
];

interface ChatClientProps {
  slug: string;
  storeName: string;
  storeDescription: string;
}

export function ChatClient({ slug, storeName, storeDescription }: ChatClientProps) {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
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

  // Toggle body class for mobile navbar visibility
  useEffect(() => {
    if (selectedChatId) {
      document.body.classList.add('is-chat-active');
    } else {
      document.body.classList.remove('is-chat-active');
    }
    return () => {
      document.body.classList.remove('is-chat-active');
    };
  }, [selectedChatId]);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(chatSearchQuery.toLowerCase()),
  );

  const activeChat = chats.find((c) => c.id === selectedChatId) || null;
  const activeMessages = messages.filter(
    (m) =>
      m.chatId === selectedChatId &&
      (m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
        (m.sender === 'me' && 'envío'.includes(messageSearchQuery.toLowerCase()))),
  );

  const handleSendMessage = (text: string) => {
    if (!selectedChatId) return;

    const newMessage: Message = {
      id: Date.now(),
      text,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chatId: selectedChatId,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Update the chat preview and time to reflect this new message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId ? { ...chat, preview: text, time: newMessage.time } : chat,
      ),
    );
  };

  const handleSendImage = (imageUrl: string) => {
    if (!selectedChatId) return;

    const newMessage: Message = {
      id: Date.now(),
      text: '',
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chatId: selectedChatId,
      imageUrl,
    };

    setMessages((prev) => [...prev, newMessage]);

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId
          ? { ...chat, preview: '📷 Imagen', time: newMessage.time }
          : chat,
      ),
    );
  };

  // Open delete dialog instead of using confirm()
  const handleDeleteChat = () => {
    if (!selectedChatId) return;
    setIsDeleteDialogOpen(true);
  };

  // Confirm deletion from dialog
  const handleConfirmDelete = () => {
    setChats((prev) => prev.filter((c) => c.id !== selectedChatId));
    setMessages((prev) => prev.filter((m) => m.chatId !== selectedChatId));
    setSelectedChatId(null);
    setIsDeleteDialogOpen(false);
  };

  // Share with check icon animation and snackbar feedback
  const handleShareChat = () => {
    if (!selectedChatId || isShareConfirmed) return;

    // Copy to clipboard logic (simplified)
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
    <div className={`${styles.chatContainer} ${selectedChatId ? styles.hasSelectedChat : ''}`}>
      <div className={styles.sidebarWrapper}>
        <ChatSidebar
          chats={filteredChats}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          searchQuery={chatSearchQuery}
          onSearchChange={setChatSearchQuery}
        />
      </div>
      <div className={styles.windowWrapper}>
        <ChatWindow
          chat={activeChat}
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
          onBack={() => setSelectedChatId(null)}
          slug={slug}
        />
      </div>
      <DeleteChatDialog
        open={isDeleteDialogOpen}
        chatName={activeChat?.name ?? null}
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
