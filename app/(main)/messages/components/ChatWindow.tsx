'use client';
import React from 'react';
import styles from '../messages.module.css';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  chatId: number;
}

const MOCK_MESSAGES = [
  { id: 101, text: 'Hi there! I wanted to follow up on the project.', isSent: false, time: '10:30 AM' },
  { id: 102, text: 'Absolutely. We are making great progress. I can show you the UI later today.', isSent: true, time: '10:35 AM' },
  { id: 103, text: 'Awesome, looking forward to it.', isSent: false, time: '10:42 AM' },
];

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [messages, setMessages] = React.useState(MOCK_MESSAGES);
  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const newMessage = {
      id: Date.now(),
      text,
      isSent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <>
      <div className={styles.chatWindowHeader}>
        <div className={styles.avatar}>U</div>
        <h3 className={styles.chatName}>User {chatId}</h3>
      </div>
      
      <div className={styles.messageList}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.messageWrapper} ${msg.isSent ? styles.messageSent : styles.messageReceived}`}>
            <span className={styles.messageTime}>{msg.time}</span>
            <div className={styles.messageBubble}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      <MessageInput onSend={handleSendMessage} />
    </>
  );
}
