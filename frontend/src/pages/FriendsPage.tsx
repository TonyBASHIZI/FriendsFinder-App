import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { avatarSrc } from '../utils/avatar';
import { useSocketStore } from '../stores/socket.store';

interface FriendRequest {
  id: string;
  createdAt: string;
  requester: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  };
}

interface Friend {
  friendshipId: string;
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const src = avatarSrc(url);
  return (
    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '🧑'}
    </div>
  );
}

export function FriendsPage() {
  const navigate = useNavigate();
  const { onlineUsers, socket } = useSocketStore();
  const [tab, setTab] = useState<'friends' | 'pending'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/pending'),
      ]);
      setFriends(friendsRes.data);
      setPending(pendingRes.data);
    } catch {
      showToast('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }

  async function respond(id: string, accept: boolean) {
    try {
      await api.patch('/friends/request/' + id + (accept ? '/accept' : '/decline'));
      showToast(accept ? '🎉 Friend added!' : 'Request declined');
      fetchAll();
    } catch {
      showToast('Something went wrong');
    }
  }

  function startChat(friend: Friend) {
    socket?.emit('start_conversation', { friendId: friend.id });
    setTimeout(() => navigate('/chat'), 300);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f10', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #27272a', background: '#18181b' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fafafa' }}>👥 Friends</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/discover')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>🌍 Discover</button>
          <button onClick={() => navigate('/chat')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>💬 Chat</button>
          <button onClick={() => navigate('/me')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👤 My Profile</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#18181b', borderRadius: 10, padding: 4, border: '1px solid #27272a' }}>
          {(['friends', 'pending'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: tab === t ? '#6366f1' : 'transparent', color: tab === t ? 'white' : '#71717a', transition: 'all 0.15s' }}>
              {t === 'friends' ? 'My Friends' : 'Pending'}{t === 'pending' && pending.length > 0 ? ' (' + pending.length + ')' : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#71717a', fontSize: 14, padding: 40 }}>Loading...</div>
        ) : tab === 'friends' ? (
          friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
              <div style={{ fontSize: 16, color: '#71717a', marginBottom: 8 }}>No friends yet</div>
              <div style={{ fontSize: 14, color: '#52525b', marginBottom: 24 }}>Discover people near you!</div>
              <button onClick={() => navigate('/discover')} style={{ padding: '10px 20px', borderRadius: 8, background: '#6366f1', border: 'none', color: 'white', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
                🌍 Go to Discover
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {friends.map((f) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: '#18181b', borderRadius: 12, border: '1px solid #27272a' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar url={f.avatarUrl} name={f.displayName || f.username} />
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: onlineUsers.has(f.id) ? '#22c55e' : '#52525b', border: '2px solid #18181b', transition: 'background 0.3s' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#fafafa' }}>{f.displayName || f.username}</div>
                    <div style={{ fontSize: 13, marginTop: 2, color: onlineUsers.has(f.id) ? '#22c55e' : '#71717a' }}>
                      {onlineUsers.has(f.id) ? '● Online' : '@' + f.username}
                    </div>
                    {f.bio && <div style={{ fontSize: 13, color: '#52525b', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.bio}</div>}
                  </div>
                  <button onClick={() => startChat(f)}
                    style={{ padding: '8px 14px', borderRadius: 8, background: '#6366f1', border: 'none', color: 'white', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
                    💬 Chat
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div style={{ fontSize: 16, color: '#71717a' }}>No pending requests</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pending.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: '#18181b', borderRadius: 12, border: '1px solid #27272a' }}>
                  <Avatar url={r.requester.avatarUrl} name={r.requester.displayName || r.requester.username} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#fafafa' }}>{r.requester.displayName || r.requester.username}</div>
                    <div style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>@{r.requester.username}</div>
                    {r.requester.bio && <div style={{ fontSize: 13, color: '#52525b', marginTop: 4 }}>{r.requester.bio}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => respond(r.id, true)} style={{ padding: '8px 14px', borderRadius: 8, background: '#6366f1', border: 'none', color: 'white', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>✓ Accept</button>
                    <button onClick={() => respond(r.id, false)} style={{ padding: '8px 14px', borderRadius: 8, background: '#27272a', border: 'none', color: '#71717a', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '12px 20px', color: '#fafafa', fontSize: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}