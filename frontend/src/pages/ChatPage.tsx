import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { api } from '../api/client';
import { avatarSrc } from '../utils/avatar';
import { useAuthStore } from '../stores/auth.store';
import { useSocketStore } from '../stores/socket.store';

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

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });
  return groups;
}

function isAudioUrl(content: string) {
  return content.includes('/uploads/voice-');
}
function isImageUrl(content: string) {
  const base = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
  return content.startsWith(base + '/uploads/') && !isAudioUrl(content);
}

export function ChatPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<any>(null);
  const activeConvoRef = useRef<Conversation | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  useEffect(() => { activeConvoRef.current = activeConvo; }, [activeConvo]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  useEffect(() => {
   const s = useSocketStore.getState().socket;
   if (!s) return;

    s.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.content,
                lastMessageAt: msg.createdAt,
                unreadCount: activeConvoRef.current?.id === msg.conversationId ? 0 : c.unreadCount + 1,
              }
            : c
        );
        const total = updated.reduce((sum, c) => sum + c.unreadCount, 0);
        setTimeout(() => useSocketStore.getState().setTotalUnread(total), 0);
        return updated;
      });
      
      if (msg.senderId !== user?.id) {
        const convo = conversationsRef.current.find((c) => c.id === msg.conversationId);
        const name = convo?.displayName || convo?.username || 'Someone';
        const body = isImageUrl(msg.content)
          ? '📷 Sent a photo'
          : msg.content.length > 60
            ? msg.content.substring(0, 60) + '...'
            : msg.content;

        if (document.hidden && Notification.permission === 'granted') {
          const src = convo?.avatarUrl ? avatarSrc(convo.avatarUrl) : undefined;
          new Notification('💬 ' + name, { body, icon: src || undefined });
        }

        document.title = '🔔 ' + name + ' sent a message';
        setTimeout(() => { document.title = 'FriendFinder'; }, 4000);

        try {
          const ctx = new AudioContext();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = 880;
          g.gain.setValueAtTime(0.1, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          o.start(ctx.currentTime);
          o.stop(ctx.currentTime + 0.3);
        } catch {}
      }
    });

    s.on('messages_history', (msgs: Message[]) => {
      setMessages(msgs);
      scrollToBottom();
    });

    s.on('conversation_started', () => { fetchConversations(); });

    s.on('friend_typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      if (userId !== user?.id && conversationId === activeConvoRef.current?.id) {
        setIsTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    setSocket(s);
    return () => {
      s.off('new_message');
      s.off('messages_history');
      s.off('conversation_started');
      s.off('friend_typing');
    };
  }, [token]);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { scrollToBottom(); }, [messages]);

  async function fetchConversations() {
    setLoading(true);
    try {
      const { data } = await api.get('/chat/conversations');
      const normalized = data.map((c: any) => ({ ...c, unreadCount: Number(c.unreadCount) || 0 }));
      setConversations(normalized);
      const total = normalized.reduce((sum: number, c: any) => sum + c.unreadCount, 0);
      setTimeout(() => useSocketStore.getState().setTotalUnread(total), 0);
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
    setIsTyping(false);
    setShowEmoji(false);
    socket?.emit('join_conversation', { conversationId: convo.id });
   setConversations((prev) => {
      const updated = prev.map((c) => c.id === convo.id ? { ...c, unreadCount: 0 } : c);
      const total = updated.reduce((sum, c) => sum + c.unreadCount, 0);
      setTimeout(() => useSocketStore.getState().setTotalUnread(total), 0);
      return updated;
    });
  }

  function sendMessage() {
    if (!input.trim() || !activeConvo || !socket) return;
    socket.emit('send_message', { conversationId: activeConvo.id, content: input.trim() });
    setInput('');
    setShowEmoji(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      socket?.emit('typing', { conversationId: activeConvo?.id, userId: user?.id });
    }
  }

  function onEmojiClick(emojiData: EmojiClickData) {
    setInput((prev) => prev + emojiData.emoji);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeConvo) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000') + data.url;
      socket?.emit('send_message', { conversationId: activeConvo.id, content: imageUrl });
    } catch {
      console.error('Failed to upload image');
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }

  async function stopRecording(send: boolean) {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);

    recorder.onstop = async () => {
      recorder.stream.getTracks().forEach((track) => track.stop());

      if (send && audioChunksRef.current.length > 0 && activeConvo) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice-' + Date.now() + '.webm');

        try {
          const { data } = await api.post('/chat/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const audioUrl = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000') + data.url;
          socket?.emit('send_message', { conversationId: activeConvo.id, content: audioUrl });
        } catch (err: any) {
          console.error('Failed to upload voice message:', err.response?.data || err.message);
        }
      }
      setRecordingTime(0);
    };

    recorder.stop();
  }

  function formatRecordingTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + s.toString().padStart(2, '0');
  }

  const grouped = groupMessagesByDate(messages);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f10', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #27272a', background: '#18181b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fafafa' }}>💬 Chat</div>
          {notifPermission !== 'granted' && (
            <button
              onClick={() => Notification.requestPermission().then((perm) => setNotifPermission(perm))}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #854d0e', background: 'rgba(133,77,14,0.15)', color: '#fbbf24', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              🔔 Enable notifications
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/discover')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>🌍 Discover</button>
          <button onClick={() => navigate('/friends')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👥 Friends</button>
          <button onClick={() => navigate('/me')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👤 Profile</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 57px)', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 300, background: '#18181b', borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #27272a' }}>
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
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: onlineUsers.has(c.friendId) ? '#22c55e' : '#52525b', border: '2px solid #18181b', transition: 'background 0.3s' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#fafafa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.displayName || c.username}</span>
                      {c.lastMessageAt && <span style={{ fontSize: 11, color: '#52525b', flexShrink: 0 }}>{formatTime(c.lastMessageAt)}</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                          {c.lastMessage
                            ? isAudioUrl(c.lastMessage) ? '🎤 Voice message'
                              : isImageUrl(c.lastMessage) ? '📷 Photo'
                              : c.lastMessage.length > 35 ? c.lastMessage.substring(0, 35) + '...'
                              : c.lastMessage
                            : 'Start a conversation'}
                        </span>
                        {onlineUsers.has(c.friendId) && (
                          <span style={{ fontSize: 11, color: '#22c55e' }}>● Online</span>
                        )}
                      </div>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#111113', position: 'relative' }}>
          {!activeConvo ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>💬</div>
              <div style={{ fontSize: 16, color: '#71717a', marginBottom: 8 }}>Select a conversation</div>
              <div style={{ fontSize: 14, color: '#52525b' }}>Or start a new one from the Friends page</div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #27272a', background: '#18181b', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar url={activeConvo.avatarUrl} name={activeConvo.displayName || activeConvo.username} size={38} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: onlineUsers.has(activeConvo.friendId) ? '#22c55e' : '#52525b', border: '2px solid #18181b', transition: 'background 0.3s' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fafafa' }}>{activeConvo.displayName || activeConvo.username}</div>
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: onlineUsers.has(activeConvo.friendId) ? '#22c55e' : '#52525b' }} />
                    <span style={{ color: onlineUsers.has(activeConvo.friendId) ? '#22c55e' : '#71717a' }}>
                      {isTyping ? 'typing...' : onlineUsers.has(activeConvo.friendId) ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => (window as any).__startCall?.(activeConvo.friendId, activeConvo.displayName || activeConvo.username, activeConvo.avatarUrl)}
                  disabled={!onlineUsers.has(activeConvo.friendId)}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    border: '1px solid #27272a',
                    background: onlineUsers.has(activeConvo.friendId) ? '#22c55e' : 'transparent',
                    color: onlineUsers.has(activeConvo.friendId) ? 'white' : '#52525b',
                    fontSize: 16, cursor: onlineUsers.has(activeConvo.friendId) ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                  📞
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}
                onClick={() => setShowEmoji(false)}>
                {grouped.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: 14 }}>
                    Say hello to {activeConvo.displayName || activeConvo.username}! 👋
                  </div>
                ) : (
                  grouped.map((group) => (
                    <div key={group.date}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
                        <div style={{ flex: 1, height: 1, background: '#27272a' }} />
                        <span style={{ fontSize: 11, color: '#52525b', background: '#111113', padding: '2px 10px', borderRadius: 99, border: '1px solid #27272a' }}>{group.date}</span>
                        <div style={{ flex: 1, height: 1, background: '#27272a' }} />
                      </div>
                      {group.messages.map((msg, i) => {
                        const isMe = msg.senderId === user?.id;
                        const prevMsg = group.messages[i - 1];
                        const isSameAuthor = prevMsg && prevMsg.senderId === msg.senderId;
                        const isImage = isImageUrl(msg.content);
                        const isAudio = isAudioUrl(msg.content);
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginTop: isSameAuthor ? 2 : 8 }}>
                            {!isMe && (
                              <div style={{ width: 28, flexShrink: 0, marginRight: 8, alignSelf: 'flex-end' }}>
                                {!isSameAuthor && <Avatar url={activeConvo.avatarUrl} name={activeConvo.displayName} size={28} />}
                              </div>
                            )}
                            <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                              {isImage ? (
                                <div style={{ borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', overflow: 'hidden', maxWidth: 240, cursor: 'pointer' }}
                                  onClick={() => window.open(msg.content, '_blank')}>
                                  <img src={msg.content} alt="shared" style={{ width: '100%', display: 'block' }} />
                                </div>
                              ) : isAudio ? (
                                <div style={{
                                  padding: '10px 14px',
                                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  background: isMe ? '#6366f1' : '#2a2a2e',
                                  display: 'flex', alignItems: 'center', gap: 10, minWidth: 220,
                                }}>
                                 <span style={{ fontSize: 18, flexShrink: 0, width: 22, textAlign: 'center' }}>🎤</span>
                                  <audio controls src={msg.content} style={{ height: 32, flex: 1, minWidth: 180 }} />
                                </div>
                              ) : (
                                <div style={{
                                  padding: '8px 12px',
                                  borderRadius: isMe
                                    ? isSameAuthor ? '16px 4px 4px 16px' : '16px 16px 4px 16px'
                                    : isSameAuthor ? '4px 16px 16px 4px' : '16px 16px 16px 4px',
                                  background: isMe ? '#6366f1' : '#2a2a2e',
                                  color: '#fafafa', fontSize: 14, lineHeight: 1.5,
                                  wordBreak: 'break-word', boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                }}>
                                  {msg.content}
                                </div>
                              )}
                              <div style={{ fontSize: 10, color: '#52525b', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {formatTime(msg.createdAt)}
                                {isMe && <span style={{ color: msg.isRead ? '#818cf8' : '#52525b', fontSize: 11 }}>{msg.isRead ? '✓✓' : '✓'}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                {isTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Avatar url={activeConvo.avatarUrl} name={activeConvo.displayName} size={24} />
                    <div style={{ background: '#2a2a2e', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#71717a', animation: 'bounce 1.2s infinite', animationDelay: i * 0.2 + 's' }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji picker */}
              {showEmoji && (
                <div style={{ position: 'absolute', bottom: 70, left: 16, zIndex: 100 }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} height={380} width={320} />
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid #27272a', background: '#18181b', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

                {isRecording ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: '#09090b', border: '1px solid #ef4444', borderRadius: 12, padding: '8px 14px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                    <span style={{ color: '#fafafa', fontSize: 14, fontFamily: 'monospace' }}>{formatRecordingTime(recordingTime)}</span>
                    <span style={{ color: '#71717a', fontSize: 13, flex: 1 }}>Recording...</span>
                    <button onClick={() => stopRecording(false)} style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    <button onClick={() => stopRecording(true)} style={{ background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 500, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>Send</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => fileInputRef.current?.click()}
                      style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #27272a', background: 'transparent', color: '#71717a', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      📎
                    </button>
                    <button onClick={() => setShowEmoji((v) => !v)}
                      style={{ width: 38, height: 38, borderRadius: 10, border: showEmoji ? '1px solid #6366f1' : '1px solid #27272a', background: showEmoji ? '#1e1b4b' : 'transparent', color: '#71717a', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      😊
                    </button>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      style={{ flex: 1, padding: '10px 14px', background: '#09090b', border: '1px solid #27272a', borderRadius: 12, color: '#fafafa', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 120 }}
                    />
                    {input.trim() ? (
                      <button onClick={sendMessage}
                        style={{ width: 38, height: 38, borderRadius: 10, background: '#6366f1', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ➤
                      </button>
                    ) : (
                      <button onClick={startRecording}
                        style={{ width: 38, height: 38, borderRadius: 10, background: 'transparent', border: '1px solid #27272a', color: '#71717a', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        🎤
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}