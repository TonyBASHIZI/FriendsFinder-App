import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../api/client';
import { avatarSrc } from '../utils/avatar';
import { useAuthStore } from '../stores/auth.store';

interface Conversation {
  id: string;
  friendId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const src = avatarSrc(url);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '🧑'}
    </div>
  );
}

export function ChatPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect socket
  useEffect(() => {
    const s = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    s.on('connect', () => console.log('Socket connected'));
    s.on('user_online', ({ userId }: { userId: string }) => setOnlineUsers((prev) => new Set([...prev, userId])));
    s.on('user_offline', ({ userId }: { userId: string }) => setOnlineUsers((prev) => { const n = new Set(prev); n.delete(userId); return n; }));
    s.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });
    s.on('messages_history', (msgs: Message[]) => {
      setMessages(msgs);
      scrollToBottom();
    });
    s.on('conversation_started', (convo: any) => {
      fetchConversations();
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchConversations() {
    setLoading(true);
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data);
    } catch {
      console.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function openConversation(convo: Conversation) {
    setActiveConvo(convo);
    setMessages([]);
    socket?.emit('join_conversation', { conversationId: convo.id });
    setConversations((prev) => prev.map((c) => c.id === convo.id ? { ...c, unreadCount: 0 } : c));
  }

  function sendMessage() {
    if (!input.trim() || !activeConvo || !socket) return;
    socket.emit('send_message', { conversationId: activeConvo.id, content: input.trim() });
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startChat(friend: any) {
    socket?.emit('start_conversation', { friendId: friend.id });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f10', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #27272a', background: '#18181b' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fafafa' }}>💬 Chat</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/discover')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>🌍 Discover</button>
          <button onClick={() => navigate('/friends')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👥 Friends</button>
          <button onClick={() => navigate('/profile')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👤 Profile</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 57px)', overflow: 'hidden' }}>
        {/* Conversations list */}
        <div style={{ width: 300, background: '#18181b', borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #27272a' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>Messages</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#71717a', fontSize: 14 }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 14, color: '#71717a', marginBottom: 8 }}>No conversations yet</div>
                <div style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Go to Friends and start a chat!</div>
                <button onClick={() => navigate('/friends')} style={{ padding: '8px 16px', borderRadius: 8, background: '#6366f1', border: 'none', color: 'white', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                  👥 Go to Friends
                </button>
              </div>
            ) : (
              conversations.map((c) => (
                <div key={c.id} onClick={() => openConversation(c)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: activeConvo?.id === c.id ? '#1e1b4b' : 'transparent', borderLeft: activeConvo?.id === c.id ? '3px solid #6366f1' : '3px solid transparent', transition: 'all 0.15s' }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar url={c.avatarUrl} name={c.displayName || c.username} size={42} />
                    {onlineUsers.has(c.friendId) && (
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #18181b' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#fafafa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.displayName || c.username}</span>
                      {c.lastMessageAt && <span style={{ fontSize: 11, color: '#52525b', flexShrink: 0 }}>{format
cat > src/pages/ChatPage.tsx << 'EOF'
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../api/client';
import { avatarSrc } from '../utils/avatar';
import { useAuthStore } from '../stores/auth.store';

interface Conversation {
  id: string;
  friendId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const src = avatarSrc(url);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '🧑'}
    </div>
  );
}

export function ChatPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect socket
  useEffect(() => {
    const s = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    s.on('connect', () => console.log('Socket connected'));
    s.on('user_online', ({ userId }: { userId: string }) => setOnlineUsers((prev) => new Set([...prev, userId])));
    s.on('user_offline', ({ userId }: { userId: string }) => setOnlineUsers((prev) => { const n = new Set(prev); n.delete(userId); return n; }));
    s.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });
    s.on('messages_history', (msgs: Message[]) => {
      setMessages(msgs);
      scrollToBottom();
    });
    s.on('conversation_started', (convo: any) => {
      fetchConversations();
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchConversations() {
    setLoading(true);
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data);
    } catch {
      console.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function openConversation(convo: Conversation) {
    setActiveConvo(convo);
    setMessages([]);
    socket?.emit('join_conversation', { conversationId: convo.id });
    setConversations((prev) => prev.map((c) => c.id === convo.id ? { ...c, unreadCount: 0 } : c));
  }

  function sendMessage() {
    if (!input.trim() || !activeConvo || !socket) return;
    socket.emit('send_message', { conversationId: activeConvo.id, content: input.trim() });
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startChat(friend: any) {
    socket?.emit('start_conversation', { friendId: friend.id });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f10', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #27272a', background: '#18181b' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fafafa' }}>💬 Chat</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/discover')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>🌍 Discover</button>
          <button onClick={() => navigate('/friends')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👥 Friends</button>
          <button onClick={() => navigate('/profile')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👤 Profile</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 57px)', overflow: 'hidden' }}>
        {/* Conversations list */}
        <div style={{ width: 300, background: '#18181b', borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #27272a' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>Messages</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#71717a', fontSize: 14 }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 14, color: '#71717a', marginBottom: 8 }}>No conversations yet</div>
                <div style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Go to Friends and start a chat!</div>
                <button onClick={() => navigate('/friends')} style={{ padding: '8px 16px', borderRadius: 8, background: '#6366f1', border: 'none', color: 'white', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                  👥 Go to Friends
                </button>
              </div>
            ) : (
              conversations.map((c) => (
                <div key={c.id} onClick={() => openConversation(c)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: activeConvo?.id === c.id ? '#1e1b4b' : 'transparent', borderLeft: activeConvo?.id === c.id ? '3px solid #6366f1' : '3px solid transparent', transition: 'all 0.15s' }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar url={c.avatarUrl} name={c.displayName || c.username} size={42} />
                    {onlineUsers.has(c.friendId) && (
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #18181b' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#fafafa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.displayName || c.username}</span>
                      {c.lastMessageAt && <span style={{ fontSize: 11, color: '#52525b', flexShrink: 0 }}>{formatTime(c.lastMessageAt)}</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage || 'Start a conversation'}</span>
                      {c.unreadCount > 0 && (
                        <span style={{ background: '#6366f1', color: 'white', fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 99, flexShrink: 0, marginLeft: 4 }}>{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!activeConvo ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#52525b' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <div style={{ fontSize: 16, color: '#71717a', marginBottom: 8 }}>Select a conversation</div>
              <div style={{ fontSize: 14, color: '#52525b' }}>Or start a new one from the Friends page</div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #27272a', background: '#18181b', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar url={activeConvo.avatarUrl} name={activeConvo.displayName || activeConvo.username} size={36} />
                  {onlineUsers.has(activeConvo.friendId) && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #18181b' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fafafa' }}>{activeConvo.displayName || activeConvo.username}</div>
                  <div style={{ fontSize: 12, color: onlineUsers.has(activeConvo.friendId) ? '#22c55e' : '#71717a' }}>
                    {onlineUsers.has(activeConvo.friendId) ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: 14 }}>
                    Say hello to {activeConvo.displayName || activeConvo.username}! 👋
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '70%' }}>
                          <div style={{ padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#6366f1' : '#27272a', color: '#fafafa', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                            {msg.content}
                          </div>
                          <div style={{ fontSize: 11, color: '#52525b', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #27272a', background: '#18181b', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  style={{ flex: 1, padding: '10px 14px', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, color: '#fafafa', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5 }}
                />
                <button onClick={sendMessage} disabled={!input.trim()}
                  style={{ padding: '10px 18px', background: input.trim() ? '#6366f1' : '#27272a', border: 'none', borderRadius: 12, color: input.trim() ? 'white' : '#52525b', fontSize: 14, fontFamily: 'inherit', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0 }}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
