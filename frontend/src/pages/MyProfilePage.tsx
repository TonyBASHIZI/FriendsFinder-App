import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useSocketStore } from '../stores/socket.store';
import { api } from '../api/client';
import { avatarSrc } from '../utils/avatar';

export function MyProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const [stats, setStats] = useState({ friendsCount: 0, memberSince: '' });
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  async function fetchProfile() {
    try {
      const { data } = await api.get('/users/me');
      setFullProfile(data);
    } catch {}
  }

  async function fetchStats() {
    try {
      const friendsRes = await api.get('/friends');
      setStats({
        friendsCount: friendsRes.data.length,
        memberSince: (user as any)?.createdAt
          ? new Date((user as any).createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })
          : '',
      });
    } catch {}
  }

  function copyUsername() {
    navigator.clipboard.writeText('@' + user?.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const src = avatarSrc(user?.avatarUrl || null);
  const isOnline = user ? onlineUsers.has(user.id) : false;

  const genderIcon: Record<string, string> = {
    male: '♂', female: '♀', non_binary: '⚧',
  };

  function getAge(birthdate: string) {
    const diff = Date.now() - new Date(birthdate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  const age = fullProfile?.birthdate ? getAge(fullProfile.birthdate) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0b', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .profile-card { animation: fadeUp 0.4s ease both; }
        .stat-card { transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
        .nav-btn:hover { border-color: #6366f1 !important; color: #fafafa !important; }
        .copy-btn:hover { background: #27272a !important; }
      `}</style>

      <div className="profile-card" style={{ width: '100%', maxWidth: 440 }}>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: '🌍 Discover', path: '/discover' },
            { label: '👥 Friends', path: '/friends' },
            { label: '💬 Chat', path: '/chat' },
            { label: '✏️ Edit profile', path: '/profile' },
          ].map((btn) => (
            <button key={btn.path} className="nav-btn" onClick={() => navigate(btn.path)} style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid #27272a',
              background: 'transparent', color: '#a1a1aa', fontSize: 12,
              fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          {/* Banner */}
          <div style={{ height: 110, background: 'linear-gradient(135deg, #312e81 0%, #4c1d95 40%, #6d28d9 70%, #7c3aed 100%)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.3) 0%, transparent 50%)' }} />
          </div>

          <div style={{ padding: '0 28px 28px', position: 'relative' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginTop: -44 }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: '4px solid #18181b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                {src ? <img src={src} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🧑'}
              </div>
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: isOnline ? '#22c55e' : '#52525b', border: '3px solid #18181b', transition: 'background 0.3s' }} />
            </div>

            {/* Name + online */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>
                  {fullProfile?.displayName || user?.displayName || user?.username}
                  {fullProfile?.gender && <span style={{ fontSize: 16, marginLeft: 6, color: '#71717a' }}>{genderIcon[fullProfile.gender]}</span>}
                </div>
                <button className="copy-btn" onClick={copyUsername} style={{ marginTop: 4, background: 'transparent', border: '1px solid #27272a', borderRadius: 6, padding: '3px 10px', color: '#71717a', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
                  @{user?.username} <span style={{ fontSize: 11 }}>{copied ? '✓ Copied!' : '⎘'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 99, background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(82,82,91,0.2)', border: '1px solid ' + (isOnline ? 'rgba(34,197,94,0.3)' : '#27272a') }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#22c55e' : '#52525b', animation: isOnline ? 'pulse 2s infinite' : 'none' }} />
                <span style={{ fontSize: 12, color: isOnline ? '#22c55e' : '#71717a', fontWeight: 500 }}>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>

            {/* Age */}
            {age && <div style={{ marginTop: 8, fontSize: 13, color: '#71717a' }}>🎂 {age} years old</div>}

            {/* Bio */}
            {fullProfile?.bio && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#09090b', borderRadius: 10, border: '1px solid #27272a', fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>
                "{fullProfile.bio}"
              </div>
            )}

            <div style={{ height: 1, background: '#27272a', margin: '20px 0' }} />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="stat-card" style={{ padding: '14px 16px', background: '#09090b', borderRadius: 12, border: '1px solid #27272a' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>{stats.friendsCount}</div>
                <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>👥 Friends</div>
              </div>
              <div className="stat-card" style={{ padding: '14px 16px', background: '#09090b', borderRadius: 12, border: '1px solid #27272a' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', marginTop: 4 }}>{stats.memberSince || '—'}</div>
                <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>🗓 Member since</div>
              </div>
            </div>

            {/* Location */}
            {fullProfile?.location && (
              <div style={{ marginTop: 10, padding: '12px 16px', background: '#09090b', borderRadius: 12, border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📍</div>
                <div>
                  <div style={{ fontSize: 13, color: '#a1a1aa' }}>Location sharing active</div>
                  <div style={{ fontSize: 11, color: '#52525b', marginTop: 1 }}>Visible to nearby people</div>
                </div>
                <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 20, padding: '10px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🌍</span>
              <span style={{ fontSize: 13, fontWeight: 600, background: 'linear-gradient(90deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FriendFinder</span>
              <span style={{ fontSize: 13, color: '#52525b' }}>·</span>
              <span style={{ fontSize: 13, color: '#71717a' }}>Find friends around you</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}