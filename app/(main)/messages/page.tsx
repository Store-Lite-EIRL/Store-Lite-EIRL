import { ChatSidebar } from './components/ChatSidebar';
import { ChatWindow } from './components/ChatWindow';
import styles from './messages.module.css';

export default function ChatPage() {
  return (
    <div className={styles.chatContainer}>
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}
