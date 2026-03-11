'use client';
import React, { useState } from 'react';
import styles from '../messages.module.css';

interface MessageInputProps {
  onSend: (text: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={styles.inputArea}>
      <md-icon-button>
        <md-icon>attach_file</md-icon>
      </md-icon-button>
      
      <div className={styles.inputFieldWrapper}>
        <md-outlined-text-field
          placeholder="Type a message..."
          value={text}
          onInput={(e: any) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: '100%', '--md-sys-color-primary': 'var(--md-sys-color-primary)' } as any}
        />
      </div>

      <md-icon-button onClick={handleSend} disabled={!text.trim()}>
        <md-icon>send</md-icon>
      </md-icon-button>
    </div>
  );
}
